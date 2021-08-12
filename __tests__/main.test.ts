import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'
import {getOwnersForFiles} from '../src/main'

// Test reviewer threshold input
// Test output
// Test only team owner
// Test only regular owners
// Test no owners

describe('codeowners-preview', () => {
  beforeAll(() => {
    process.env['GITHUB_REF'] = 'refs/pulls/6/merge'
    process.env['GITHUB_REPOSITORY'] = 'jnwng/codeowners-preview-action'
  })

  test('creates owner sets', () => {
    const filenames = [
      '.github/workflows/migration.yml',
      '.github/workflows/test.yml',
      'CODEOWNERS',
      '__fixtures__/blank-file.txt',
      '__tests__/main.test.ts',
      'action.yml',
      'dist/index.js',
      'dist/index.js.map',
      'dist/licenses.txt',
      'dist/sourcemap-register.js',
      'package-lock.json',
      'package.json',
      'src/main.ts',
      'src/wait.ts'
    ]
    const owners = getOwnersForFiles(filenames)
    expect(owners).toMatchInlineSnapshot(`
Object {
  "ownerSet": Set {
    "@jnwng",
    "@jnwng-1",
    "@jnwng-2",
    "@jnwng-3",
    "@jnwng-4",
    "@jnwng-5",
  },
  "teamOwnerSet": Set {},
}
`)
  })
})

// test('throws invalid number', async () => {
//   const input = parseInt('foo', 10)
//   await expect(wait(input)).rejects.toThrow('milliseconds not a number')
// })

// test('wait 500 ms', async () => {
//   const start = new Date()
//   await wait(500)
//   const end = new Date()
//   var delta = Math.abs(end.getTime() - start.getTime())
//   expect(delta).toBeGreaterThan(450)
// })

// // shows how the runner will run a javascript action with env / stdout protocol
// test('test runs', () => {
//   process.env['INPUT_MILLISECONDS'] = '500'
//   const np = process.execPath
//   const ip = path.join(__dirname, '..', 'lib', 'main.js')
//   const options: cp.ExecFileSyncOptions = {
//     env: process.env
//   }
//   console.log(cp.execFileSync(np, [ip], options).toString())
// })
