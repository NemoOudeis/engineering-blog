import { ProblemResponse } from '@stewartmcgown/grammarly-api/build/lib/responses'
import {danger, warn} from 'danger'
import {analyseFile} from './grammarly'

const grammarly = async (dos: string[]) => {
  for(const doc of docs) {
    const results = await analyseFile(doc)
    const alerts: ProblemResponse[] = results.map(it => it.alerts).flat(2)
    warn("", doc)
  }
}

const docs = danger.git.modified_files.concat(danger.git.created_files).filter(it => it.endsWith('.md'))

grammarly(docs)


// No PR is too small to include a description of why you made a change
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}



