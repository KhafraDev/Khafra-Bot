import { stringify } from 'node:querystring'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import { InteractionSubCommand } from '#khaf/Interaction'
import { sql } from '#khaf/database/Postgres.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'

interface Insights {
  k_date: Date
  k_left: number
  k_joined: number
}

const Chart = async (o: Record<string, string>): Promise<ArrayBuffer> => {
  const query = stringify(o)

  const { body } = await request(`https://image-charts.com/chart.js/2.8.0?${query}`, {
    headers: {
      'User-Agent': 'PseudoBot'
    }
  })

  return body.arrayBuffer()
}

export class kSubCommand extends InteractionSubCommand {
  constructor() {
    super({
      references: 'insights',
      name: 'graph'
    })
  }

  async handle(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const id = interaction.guildId ?? interaction.guild?.id

    if (!id) {
      return {
        content: '❌ Re-invite the bot with the correct permissions to use this command!',
        ephemeral: true
      }
    }

    const rows = await sql<Insights[]>`
      WITH removed AS (
          DELETE FROM kbInsights
          WHERE k_date <= CURRENT_DATE - 14 AND k_guild_id = ${id}::text
      )

      SELECT k_date, k_left, k_joined
      FROM kbInsights
      WHERE 
          k_guild_id = ${id}::text AND
          k_date > CURRENT_DATE - 14 AND
          k_date < CURRENT_DATE
      ORDER BY kbInsights.k_date ASC;
    `

    if (rows.length === 0) {
      return {
        content: '❌ There are no insights available for the last 14 days!',
        ephemeral: true
      }
    }

    const locale = interaction.guild?.preferredLocale ?? 'en-US'
    const intl = Intl.DateTimeFormat(locale, { dateStyle: 'long' })

    const { Dates, Joins, Leaves } = rows.reduce(
      (red, row) => {
        red.Dates.push(intl.format(row.k_date))
        red.Joins.push(row.k_joined.toLocaleString(locale))
        red.Leaves.push(row.k_left.toLocaleString(locale))

        return red
      },
      {
        Dates: [] as string[],
        Joins: [] as string[],
        Leaves: [] as string[]
      }
    )

    // https://www.chartjs.org/docs/2.8.0/
    const data = JSON.stringify({
      type: 'line',
      data: {
        labels: Dates,
        datasets: [
          {
            label: 'Joins',
            borderColor: 'rgb(255,+99,+132)',
            backgroundColor: 'rgba(255,+99,+132,+.5)',
            data: Joins
          },
          {
            label: 'Leaves',
            borderColor: 'rgb(54,+162,+235)',
            backgroundColor: 'rgba(54,+162,+235,+.5)',
            data: Leaves
          }
        ]
      },
      options: {
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'Members',
                fontColor: 'rgb(255, 255, 255)',
                fontSize: 20
              },
              offset: true,
              ticks: {
                fontColor: 'rgb(255, 255, 255)',
                fontSize: 30
              }
            }
          ],
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'Date',
                fontColor: 'rgb(255, 255, 255)',
                fontSize: 20
              },
              offset: true,
              ticks: {
                fontColor: 'rgb(255, 255, 255)',
                fontSize: 20
              }
            }
          ]
        },
        legend: {
          labels: {
            fontColor: 'rgb(255, 255, 255)',
            fontSize: 30
          }
        }
      }
    })

    const chart = await Chart({
      chart: data,
      width: '1920',
      height: '1080',
      backgroundColor: 'rgb(54, 57, 63)'
    }).catch(() => null)

    if (chart === null) {
      return {
        content: '❌ An unexpected error occurred.',
        ephemeral: true
      }
    }

    return {
      files: [
        {
          attachment: arrayBufferToBuffer(chart),
          name: 'chart.png'
        }
      ]
    }
  }
}
