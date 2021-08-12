import * as core from '@actions/core'
import Codeowners from 'codeowners'
// import {Octokit} from '@octokit/action'

// https://github.com/octokit/action.js/#create-an-issue-using-rest-api
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

// https://github.com/actions/checkout/issues/58#issuecomment-545446510
const PULL_NUMBER_REGEX = /refs\/pull\/(\d+)\/merge/
const [, pull_number] = process.env.GITHUB_REF.match(PULL_NUMBER_REGEX)
const octokit = new Octokit()

const codeowners = new Codeowners()

const teamOwnerPrefix = new RegExp(`@${owner}/`)
const allBuckets = {}
for (const ownerEntry of codeowners.ownerEntries) {
  for (const username of ownerEntry.usernames) {
    if (teamOwnerPrefix.test(username)) {
      allBuckets[username] = [...allBuckets[username], ownerEntry.path]
    }
  }
}
core.debug(`Owner buckets: ${JSON.stringify(allBuckets, null, 2)}`)

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
    core.debug(`Files being checked: ${JSON.stringify(files, null, 2)}`)

    const ownerSet = new Set()
    const teamOwnerSet = new Set()
    for (const filename of filenames) {
      const owners = codeowners.getOwner(filename)

      const teamOwnerPrefix = new RegExp(`@${owner}/`)
      for (const ownerName of owners) {
        if (teamOwnerPrefix.test(ownerName)) {
          teamOwnerSet.add(ownerName)
        } else {
          ownerSet.add(ownerName)
        }
      }
    }
    core.debug(`Owners: ${JSON.stringify(teamOwnerSet, null, 2)}`)
    core.debug(`Team owners: ${JSON.stringify(teamOwnerSet, null, 2)}`)

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
