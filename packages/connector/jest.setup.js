// eslint-disable-next-line @typescript-eslint/no-var-requires
const Knex = require('knex')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IORedis = require('ioredis')
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5433/testing'
const REDIS_URL = process.env.REDIS || 'redis://127.0.0.1:6380'
const redis = new IORedis(REDIS_URL)

module.exports = async () => {
  const knex = Knex({
    client: 'postgresql',
    connection: DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  })

  // node pg defaults to returning bigint as string. This ensures it parses to bigint
  knex.client.driver.types.setTypeParser(
    knex.client.driver.types.builtins.INT8,
    'text',
    BigInt
  )
  await knex.migrate.latest({
    directory: __dirname + '/migrations'
  })
  global.__CONNECTOR_KNEX__ = knex

  if (redis.status === 'ready') {
    await redis.disconnect()
  } else {
    throw new Error('expected redis at ' + REDIS_URL)
  }
}
