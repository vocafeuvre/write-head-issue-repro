/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import fs from 'node:fs'
import onFinished from 'on-finished'
import destroy from 'destroy'
import app from '@adonisjs/core/services/app'

router.on('/').render('pages/home')

router
  .get('/dump-error', async ({ response }) => {
    const stream = fs.createReadStream(app.tmpPath('sample.csv'))

    response.header('accept-ranges', 'bytes')
    response.header('content-type', 'application/octet-stream')
    response.header('transfer-encoding', 'chunked')
    response.header('content-disposition', `attachment; filename=sample-error.csv`)

    response.writeHead(200)

    return response.stream(stream)
  })
  .use(middleware.transfer_encoding())

router
  .get('/dump', async ({ response }) => {
    const stream = fs.createReadStream(app.tmpPath('sample.csv'))

    response.header('accept-ranges', 'bytes')
    response.header('content-type', 'application/octet-stream')
    response.header('transfer-encoding', 'chunked')
    response.header('content-disposition', `attachment; filename=sample-good.csv`)

    response.writeHead(200)

    const body = stream

    // lines below copied straight from adonisjs/http-server/response.ts
    //
    // reason why we don't use response.stream is because
    // the underlying implementation doesn't pipe the stream
    // to the response body whenever the response is not pending.
    // a response is not pending anymore if response.writeHead
    // has been called, which we must do because we don't set
    // content-length

    let finished = false
    body.on('error', (error) => {
      if (finished) {
        return
      }
      finished = true
      response.abort(body)
      if (!response.headersSent) {
        response.response.end('Error: ' + error)
      } else {
        destroy(body)
      }
    })
    body.on('end', () => {
      if (!response.headersSent) {
        response.response.end()
      }
    })
    onFinished(response.response, () => {
      finished = true
      destroy(body)
    })
    body.pipe(response.response)
  })
  .use(middleware.transfer_encoding())
