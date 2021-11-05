import { Grammarly } from '@stewartmcgown/grammarly-api';
import { ProblemResponse } from '@stewartmcgown/grammarly-api/build/lib/responses';


const text = `
Hemingway App makes your writing bold and clear.

The app highlights lengthy, complex sentences and common errors; if you see a yellow sentence, shorten or split it. If you see a red highlight, your sentence is so dense and complicated that your readers will get lost trying to follow its meandering, splitting logic — try editing this sentence to remove the red.

You can utilize a shorter word in place of a purple one. Mouse over them for hints.

Adverbs and weakening phrases are helpfully shown in blue. Get rid of them and pick words with force, perhaps.

Phrases in green have been marked to show passive voice.

You can format your text with the toolbar.

Paste in something you're working on and edit away. Or, click the Write button and compose something new.`;

const credentials = {
    auth: {
      grauth: process.env['GRAMMARLY_GRAUTH_TOKEN'] || "",
      'csrf-token': process.env['GRAMMARLY_CRSF_TOKEN'] || ""
    }
}

const grammarly = new Grammarly(credentials)

const main = async (text: string) => {
    const results = await grammarly.analyse(text);
    results.alerts.forEach(transformProblemResponse)

    console.log(results)

    process.exit(0)
}

main(text)

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