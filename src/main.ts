/* eslint-disable no-console */
import * as core from '@actions/core'
import Codeowners from 'codeowners'
import {Octokit} from '@octokit/action'
import {cleanEnv, str} from 'envalid'

debugger

const env = cleanEnv(process.env, {
  GITHUB_REPOSITORY: str(),
  GITHUB_REF: str()
})

// https://github.com/octokit/action.js/#create-an-issue-using-rest-api
const [owner, repo] = env.GITHUB_REPOSITORY.split('/')

// https://github.com/actions/checkout/issues/58#issuecomment-545446510
const PULL_NUMBER_REGEX = /refs\/pull\/(\d+)\/merge/

let pull_number: number
if (PULL_NUMBER_REGEX.test(env.GITHUB_REF)) {
  pull_number = parseInt(env.GITHUB_REF.match(PULL_NUMBER_REGEX)![1], 10)
}
const octokit = new Octokit()
const codeowners = new Codeowners()

const teamOwnerPrefix = new RegExp(`@${owner}/`)
const allBuckets = {}
// @ts-ignore
for (const ownerEntry of codeowners.ownerEntries) {
  for (const username of ownerEntry.usernames) {
    if (teamOwnerPrefix.test(username)) {
      // @ts-ignore
      allBuckets[username] = [...allBuckets[username], ownerEntry.path]
    }
  }
}
console.log(`Owner buckets: ${JSON.stringify(allBuckets, null, 2)}`)

export const getOwnersForFiles = (
  filenames: string[]
): {ownerSet: Set<string>; teamOwnerSet: Set<string>} => {
  const ownerSet = new Set<string>()
  const teamOwnerSet = new Set<string>()
  for (const filename of filenames) {
    const owners = codeowners.getOwner(filename)

    for (const ownerName of owners) {
      if (teamOwnerPrefix.test(ownerName)) {
        teamOwnerSet.add(ownerName)
      } else {
        ownerSet.add(ownerName)
      }
    }
  }
  console.log(`Owners: ${JSON.stringify(ownerSet, null, 2)}`)
  console.log(`Team owners: ${JSON.stringify(teamOwnerSet, null, 2)}`)

  return {ownerSet, teamOwnerSet}
}

// One argument: the reviewer threshold.
// One output: `aboveReviewerThreshold`
async function run(): Promise<void> {
  try {
    // Figure out what the changed files are
    const files = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number
    })
    const filenames = files.data.map(file => file.filename)
    console.log(`Files being checked: ${JSON.stringify(filenames, null, 2)}`)

    const {ownerSet, teamOwnerSet} = getOwnersForFiles(filenames)

    const OWNER_THRESHOLD = Number.parseInt(
      core.getInput('reviewerThreshold'),
      10
    )
    if (ownerSet.size + teamOwnerSet.size > OWNER_THRESHOLD) {
      // Comment back to the PR
      // Label to trigger mise-en-place
      core.setOutput('aboveReviewerThreshold', true)
    } else {
      core.setOutput('aboveReviewerThreshold', false)
    }

    // This is where we take the subset of buckets
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
