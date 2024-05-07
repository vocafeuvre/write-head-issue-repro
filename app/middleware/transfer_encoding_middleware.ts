import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import type { NextFn } from '@adonisjs/core/types/http'
import { Transform, pipeline } from 'node:stream'

export default class TransferEncodingMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()

    if (
      response.hasStream &&
      response.outgoingStream &&
      response.getHeader('transfer-encoding') === 'chunked'
    ) {
      const chunkTransform = new Transform({
        transform(chunk, _, callback) {
          const chunkLength = chunk.length.toString(16)
          const chunkData = `${chunkLength}\r\n${chunk.toString()}\r\n`
          callback(null, chunkData)
        },

        flush(callback) {
          callback(null, '0\r\n\r\n')
        },
      })

      pipeline(response.outgoingStream, chunkTransform, (err) => {
        if (err) {
          logger.error({ err }, 'Error on transforming chunked stream')
        }
      })
    }
  }
}
