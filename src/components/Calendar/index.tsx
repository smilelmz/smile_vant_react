/* eslint-disable no-lonely-if */
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  t,
  bem,
  copyDate,
  copyDates,
  getPrevDay,
  getNextDay,
  compareDay,
  calcDateNum,
  compareMonth,
  getDayByOffset
} from './utils'
import {
  DayItem,
  CalendarProps,
  IHandles,
  CalendarHandler
} from './index.types'
import Popup from '../Popup'
import Button from '../Button'
import Toast from '../Toast'
import CalendarMonth from './components/Month'
import CalendarHeader from './components/Header'
import { useRefs, getRect } from '../composables'
import { getScrollTop, raf } from '../utils'
import { useI18n } from '../locale'

const getMaxDate = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
}

const Calendar = ({
  show,
  type = 'single',
  title,
  color = '#ee0a24',
  footer,
  minDate = new Date(),
  maxDate = getMaxDate(),
  defaultDate,
  rowHeight,
  formatter,
  poppable = true,
  lazyRender,
  showMark = true,
  showTitle = true,
  showSubtitle = true,
  showConfirm = true,
  readonly,
  confirmText,
  confirmDisabledText,
  firstDayOfWeek = 0,
  position = 'bottom',
  round = true,
  closeOnClickOverlay = true,
  safeAreaInsetBottom = true,
  maxRange = '',
  rangePrompt,
  allowSameDay,
  select,
  confirm,
  close,
  opened,
  closed,
  unselect,
  monthShow
}: CalendarProps) => {
  const calendarRef = useRef<CalendarHandler>(null)
  const limitDateRange = (date: Date, min = minDate, max = maxDate) => {
    if (compareDay(date, min) === -1) {
      return min
    }
    if (compareDay(date, max) === 1) {
      return max
    }
    return date
  }
  const getInitialDate = (date = defaultDate) => {
    if (date === null) {
      return date
    }
    const now = new Date()
    if (type === 'range') {
      if (!Array.isArray(date)) {
        date = []
      }
      const start = limitDateRange(date[0] || now, minDate, getPrevDay(maxDate))
      const end = limitDateRange(date[1] || now, getNextDay(minDate))
      return [start, end]
    }
    if (type === 'multiple') {
      if (Array.isArray(date)) {
        return date.map((date) => limitDateRange(date))
      }
      return [limitDateRange(now)]
    }
    if (!date || Array.isArray(date)) {
      date = now
    }
    return limitDateRange(date)
  }
  let bodyHeight: number
  const bodyRef = useRef<HTMLDivElement>(null)
  const { messages } = useI18n()
  const [state, setState] = useState<{
    subtitle: string
    currentDate: Date | Date[]
  }>({
    subtitle: '',
    currentDate: getInitialDate()
  })
  const [monthRefs, setMonthRefs] = useRefs<React.Ref<IHandles>>()
  const dayOffset = useMemo(() => (firstDayOfWeek ? +firstDayOfWeek % 7 : 0), [
    firstDayOfWeek
  ])
  const months = useMemo(() => {
    const months = []
    const cursor = new Date(minDate)
    cursor.setDate(1)
    do {
      months.push(new Date(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    } while (compareMonth(cursor, maxDate) !== 1)
    return months
  }, [minDate, maxDate])
  const buttonDisabled = useMemo(() => {
    const { currentDate } = state
    if (currentDate) {
      if (type === 'range') {
        return !(currentDate as Date[])[0] || !(currentDate as Date[])[1]
      }
      if (type === 'multiple') {
        return !(currentDate as Date[]).length
      }
    }
    return !currentDate
  }, [type])
  const onScroll = () => {
    const top = getScrollTop(bodyRef.current!)
    const bottom = top + bodyHeight

    const heights = months.map((item, index) =>
      monthRefs.current[index]
        ? ((monthRefs.current[index] as unknown) as IHandles).getHeight()
        : 0
    )
    const heightSum =
      heights.reduce((a, b) => (a as number) + (b as number), 0) || 0
    // iOS scroll bounce may exceed the range
    if (bottom > heightSum && top > 0) {
      return
    }
    let height = 0
    let currentMonth
    const visibleRange = [-1, -1]
    for (let i = 0; i < months.length; i++) {
      const month = (monthRefs.current[i] as unknown) as IHandles
      const visible = height <= bottom && height + (heights[i] as number) >= top
      if (visible) {
        visibleRange[1] = i
        if (!currentMonth) {
          currentMonth = month
          visibleRange[0] = i
        }
        if (!month.showed) {
          month.showed = true
          monthShow && monthShow(month.date, month.getTitle())
        }
      }

      height += heights[i] as number
    }

    months.forEach((month, index) => {
      const visible =
        index >= visibleRange[0] - 1 && index <= visibleRange[1] + 1
      monthRefs.current[index]
        ? ((monthRefs.current[index] as unknown) as IHandles).setVisible(
            visible
          )
        : null
    })
    if (currentMonth) {
      setState({
        ...state,
        subtitle: currentMonth
          ? ((currentMonth as unknown) as IHandles).getTitle()
          : ''
      })
    }
  }
  const scrollToDate = (targetDate: Date) => {
    raf(() => {
      months.some((month: Date, index: number) => {
        if (compareMonth(month, targetDate) === 0) {
          monthRefs[index].scrollIntoView(bodyRef.current)
          return true
        }

        return false
      })
      onScroll()
    })
  }
  const scrollIntoView = () => {
    if (poppable && !show) {
      return
    }
    const { currentDate } = state
    if (currentDate) {
      const targetDate =
        type === 'single' ? currentDate : (currentDate as Date[])[0]
      scrollToDate(targetDate as Date)
    } else {
      raf(onScroll)
    }
  }
  const init = () => {
    if (poppable && !show) {
      return
    }
    raf(() => {
      bodyHeight = Math.floor(getRect(bodyRef).height)
      scrollIntoView()
    })
  }

  const reset = (date = getInitialDate()) => {
    setState({
      ...state,
      currentDate: date
    })
    scrollIntoView()
  }

  const checkRange = (date: [Date, Date]) => {
    if (maxRange && calcDateNum(date) > maxRange) {
      Toast.info(rangePrompt || t(messages, 'rangePrompt', maxRange))
      return false
    }
    return true
  }
  const onConfirm = () => {
    confirm && confirm(copyDates(state.currentDate))
  }
  const selectDay = (date: Date | Date[], complete?: boolean) => {
    const setCurrentDate = (date: Date | Date[]) => {
      setState({ ...state, currentDate: date })
      select && select(copyDates(state.currentDate))
    }

    if (complete && type === 'range') {
      const valid = checkRange(date as [Date, Date])

      if (!valid) {
        // auto selected to max range if showConfirm
        if (showConfirm) {
          setCurrentDate([
            (date as Date[])[0],
            getDayByOffset((date as Date[])[0], +maxRange - 1)
          ])
        } else {
          setCurrentDate(date)
        }
        return
      }
    }
    setCurrentDate(date)
    if (complete && !showConfirm) {
      onConfirm()
    }
  }
  const onClickDay = (item: DayItem) => {
    if (readonly || !item.date) {
      return
    }
    const { date } = item
    const { currentDate } = state
    if (type === 'range') {
      if (!currentDate) {
        selectDay([date])
        return
      }
      const [startDay, endDay] =
        currentDate instanceof Date ? [currentDate] : currentDate
      if (startDay && !endDay) {
        const compareToStart = compareDay(date, startDay)
        if (compareToStart === 1) {
          selectDay([startDay, date], true)
        } else if (compareToStart === -1) {
          selectDay([date])
        } else if (allowSameDay) {
          selectDay([date, date], true)
        }
      } else {
        selectDay([date])
      }
    } else if (type === 'multiple') {
      if (!currentDate) {
        selectDay([date])
        return
      }
      let selectedIndex: number = -1
      const dateList =
        state.currentDate instanceof Date
          ? [state.currentDate]
          : state.currentDate
      const selected = dateList.some((dateItem: Date, index: number) => {
        const equal = compareDay(dateItem, date) === 0
        if (equal) {
          selectedIndex = index
        }
        return equal
      })
      if (selected && selectedIndex !== -1) {
        const [unselectedDate] = dateList.splice(selectedIndex, 1)
        unselect && unselect(copyDate(unselectedDate))
      } else if (maxRange && dateList.length >= maxRange) {
        Toast.info(rangePrompt || t(messages, 'rangePrompt', maxRange))
      } else {
        if (currentDate instanceof Date) {
          selectDay([currentDate, date])
        } else {
          selectDay([...currentDate, date])
        }
      }
    } else {
      selectDay(date, true)
    }
  }
  const renderMonth = (date: Date, index: number) => {
    const showMonthTitle = index !== 0 || !showSubtitle
    const monthProps = {
      type,
      color,
      minDate,
      maxDate,
      showMark,
      formatter,
      rowHeight,
      lazyRender,
      showSubtitle,
      allowSameDay
    }
    return (
      <CalendarMonth
        ref={setMonthRefs(index)}
        date={date}
        currentDate={state.currentDate}
        showMonthTitle={showMonthTitle}
        firstDayOfWeek={dayOffset}
        click={onClickDay}
        {...monthProps}
      />
    )
  }

  const renderFooterButton = () => {
    if (footer) {
      return footer
    }
    if (showConfirm) {
      const text = buttonDisabled ? confirmDisabledText : confirmText
      return (
        <Button
          round
          block
          type='danger'
          color={color}
          className={bem('confirm')}
          disabled={buttonDisabled}
          nativeType='button'
          click={onConfirm}
        >
          {text || t(messages, 'confirm')}
        </Button>
      )
    }
  }

  const renderFooter = () => (
    <div className={bem('footer', { unfit: !safeAreaInsetBottom })}>
      {renderFooterButton()}
    </div>
  )

  const renderCalendar = () => (
    <div className={bem()}>
      <CalendarHeader
        title={title}
        showTitle={showTitle}
        subtitle={state.subtitle}
        showSubtitle={showSubtitle}
        firstDayOfWeek={dayOffset}
      />
      <div ref={bodyRef} className={bem('body')} onScroll={onScroll}>
        {months.map(renderMonth)}
      </div>
      {renderFooter()}
    </div>
  )

  useEffect(() => {
    init()
  }, [show])

  useEffect(() => {
    reset(getInitialDate(state.currentDate))
  }, [type, minDate, maxDate])

  useEffect(() => {
    if (defaultDate) setState({ ...state, currentDate: defaultDate })
    scrollIntoView()
  }, [defaultDate])

  useImperativeHandle(calendarRef, () => ({
    reset,
    scrollToDate
  }))
  if (poppable) {
    return (
      <Popup
        show={show}
        className={bem('popup')}
        round={round}
        position={position}
        closeable={showTitle || showSubtitle}
        closeOnClickOverlay={closeOnClickOverlay}
        close={close}
        opened={opened}
        closed={closed}
      >
        {renderCalendar()}
      </Popup>
    )
  }
  return renderCalendar()
}
export default React.forwardRef(Calendar)
