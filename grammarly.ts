import { Grammarly } from '@stewartmcgown/grammarly-api';
import { GrammarlyResult } from '@stewartmcgown/grammarly-api/build/lib/api';
import { ProblemResponse } from '@stewartmcgown/grammarly-api/build/lib/responses';
import * as fs from 'fs/promises';

const credentials = {
    auth: {
      grauth: process.env['GRAMMARLY_GRAUTH_TOKEN'] || "",
      'csrf-token': process.env['GRAMMARLY_CRSF_TOKEN'] || ""
    }
}

const exists = async (path: string) => {
    try {
        const result = await fs.stat(path)
        return !result ? result : true
    } catch {
        return false
    }
}

const grammarly = new Grammarly(credentials)

export const analyseFile = async (path: string): Promise<GrammarlyResult[]> => {

    const text = await fs.readFile(`./${path}`, { encoding: 'utf-8' })
    
    let paragraphs = 
        text.split('---\n')[2] // strip preamble
            .split('```') // strip code snippets
            .filter( (v,i) => i % 2 === 0)
            .join('\n')
            .split('\n\n') // split paragraphs
            .filter(it => !it.startsWith('![')) // filter images
            .filter(it => it !== "") // filter empty lines
    
    console.log(paragraphs.length)

    const results = []

    let iterations = 0

    for(const paragraph of paragraphs) {
        iterations++
        console.log(iterations)
        if(iterations % 10 === 0) {
            console.log('sleeping...')
            await sleep(60_000)
            console.log('continue...')
        }

        const result = await analyseText(paragraph)
        if (result.alerts.length > 0) {
            results.push(result)
        }
        console.log(`result size ${results.length}`)
    }

    return results
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const dump = async (contents: any) => {
    await fs.writeFile('./dump.json', JSON.stringify(contents, null, 2), { encoding: 'utf-8' })
}

const analyseText = async (text: string) => {
    const results = await grammarly.analyse(text);
    results.alerts.forEach(transformProblemResponse)
    return results
}

const main = async () => {

    // content/post/graceful-k8s-delpoyments/index.md
    // content/post/elm-at-rakuten/index.md

    const files = process.argv.slice(2)

    for (const file of files) {
        dump(await analyseFile(file))
    }

    process.exit(0)
}

main()

const transformProblemResponse = (it: ProblemResponse): ProblemResponse =>  {
    it.details = htmlToMarkdown(it.details || "")
    it.examples = htmlToMarkdown(it.examples || "")
    it.title = htmlToMarkdown(it.title || "")
    it.explanation = htmlToMarkdown(it.explanation || "")

    return it
}

const htmlToMarkdown = (...html: string[]) => {
    return html
        .filter((value) => typeof value === 'string')
        .join('\n\n')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<p>/gi, '\n\n') // Explanation has unclosed <p> tag.)
        .replace(/<br\/>/gi, '  \n')
        .replace(/<span class="red">/gi, '❌ <span style="color:#FF0000">')
        .replace(/<span class="green">/gi, '✅ <span style="color:#00FF00">')
        .replace(/<span class="grey">/gi, '😕 <span style="color:##464646">')
        .replace(/\n{3,}/g, '\n\n') // Remove unnecessary empty lines.
        .trim()
}