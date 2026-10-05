import { Text, View } from '@tarojs/components'
import { getStartAndEndForCampus } from '@/utils/scheduleTime'
import './scheduleGrid.scss'

/**
 * 课表左侧时间轴：节次 + 该节次的起止时间。
 *
 * 对应 Flutter 的 `lib/ui/components/schedule/timeline_column.dart`。时间来自
 * 当前生效的作息表（远端优先，内置兜底），越界节次回退草堂。
 */
export function TimelineColumn({
  periodCount,
  cellHeight,
  campus,
  showGrid,
}: {
  periodCount: number
  /** 每格高度，单位 rpx */
  cellHeight: number
  campus: string
  showGrid: boolean
}) {
  return (
    <View className='timeline'>
      {Array.from({ length: periodCount }, (_, index) => {
        const period = index + 1
        const time = getStartAndEndForCampus(campus, period, period)
        return (
          <View
            className={`timeline__cell ${showGrid ? 'timeline__cell--grid' : ''}`}
            style={{ height: `${cellHeight}rpx` }}
            key={period}
          >
            <Text className='timeline__period'>{period}</Text>
            {time.start ? <Text className='timeline__time'>{time.start}</Text> : null}
            {time.end ? <Text className='timeline__time'>{time.end}</Text> : null}
          </View>
        )
      })}
    </View>
  )
}
