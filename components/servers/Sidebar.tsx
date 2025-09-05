'use client'

import type { Agent, DiskUsageStat, SensorsTemperatureStat, SystemInfo } from '@/lib/api'
import { formatBytes, formatShortTime, formatTemperature } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Cpu,
  HardDrive,
  LucideCpu,
  LucideHardDrive,
} from 'lucide-react'
import { useMemo, type ElementType } from 'react'
import type { FieldPath, FieldPathValue } from 'react-hook-form'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupField } from '../ui/radio-group'
import { Skeleton } from '../ui/skeleton'
import { store } from './store'

export default function ServersSidebar() {
  const agents = store.agents.use()

  return (
    <div className="content scrollbar-hidden flex flex-col w-[600px] max-w-[35vw] lg:max-w-[50vw] border">
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Label className="text-sm">Servers</Label>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Temperature Unit</Label>
          <CpuTemperatureRadio />
        </div>
      </div>
      <div className="px-3 py-3 space-y-3">
        <ServerItem key="Main Server" />
        {Object.values(agents ?? {}).map(agent => (
          <ServerItem key={agent.name} agent={agent} />
        ))}
      </div>
    </div>
  )
}

function ServerItem({ agent }: { agent?: Agent }) {
  const agentKey = agent?.name || 'GoDoxy'
  return (
    <div className="block p-4 rounded-xl border bg-card text-card-foreground transition-all hover:bg-accent/50 hover:shadow-md">
      <a href={`#${!agent ? '' : agent.name}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="sidebar-item-title truncate font-medium">{agentKey}</div>
            <store.Render path={`systemInfo.${agentKey}.timestamp`}>
              {timestamp => (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                  {timestamp ? `@ ${formatShortTime(timestamp)}` : '—'}
                </span>
              )}
            </store.Render>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricTile
              label="CPU"
              icon={Cpu}
              agent={agentKey}
              field="cpu_average"
              formatter={formatPercent}
            />
            <MetricTile
              label="Memory"
              icon={Activity}
              agent={agentKey}
              field="memory"
              formatter={value => `${formatBytes(value.used)} / ${formatBytes(value.total)}`}
            />
            <MetricTile
              label="Disk"
              icon={HardDrive}
              agent={agentKey}
              field="disks"
              formatter={formatTopDiskShort}
            />
            <MetricTile
              label="Upload"
              icon={ArrowUp}
              iconClassName="text-error"
              agent={agentKey}
              field="network.upload_speed"
              formatter={value => formatBytes(value, { unit: '/s' })}
            />
            <MetricTile
              label="Download"
              icon={ArrowDown}
              iconClassName="text-success"
              agent={agentKey}
              field="network.download_speed"
              formatter={value => formatBytes(value, { unit: '/s' })}
            />
            <TemperatureTile agent={agentKey} />
          </div>
        </div>
      </a>
    </div>
  )
}

function CpuTemperatureRadio() {
  const [temperatureUnit, setTemperatureUnit] = store.temperatureUnit.useState()
  return (
    <RadioGroup
      value={temperatureUnit}
      onValueChange={e => setTemperatureUnit(e as 'celsius' | 'fahrenheit')}
      className="flex flex-row gap-x-2"
    >
      <RadioGroupField label="°C" value="celsius" />
      <RadioGroupField label="°F" value="fahrenheit" />
    </RadioGroup>
  )
}

function MetricTile<P extends FieldPath<SystemInfo>>({
  icon: Icon,
  iconClassName,
  agent,
  field,
  formatter,
  label,
}: {
  icon: ElementType
  iconClassName?: string
  agent: string
  field: P
  formatter?: (value: FieldPathValue<SystemInfo, P>) => string
  label?: string
}) {
  const value = store.use(`systemInfo.${agent}.${field}`)
  const formattedValue = useMemo(
    () => (value !== undefined ? (formatter ? formatter(value) : String(value)) : undefined),
    [value, formatter]
  )
  return (
    <div className="flex flex-col items-center justify-center text-center min-w-0">
      <Icon className={cn('h-4 w-4 text-primary', iconClassName)} />
      <div className="text-xs mt-1 w-fit truncate font-medium" title={formattedValue}>
        {formattedValue ? formattedValue : <Skeleton className="h-4 w-8" />}
      </div>
      {label && <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>}
    </div>
  )
}

function formatPercent(n?: number | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  const v = Math.max(0, Math.min(100, n))
  return `${v.toFixed(v < 10 ? 1 : 0)}%`
}

function formatTopDiskShort(disks: Record<string, DiskUsageStat>): string {
  if (!disks) return '—'
  const values = Object.values(disks)
  if (values.length === 0) return '—'

  const root = values.find(e => e.path === '/') || values[0]!

  return `${formatPercent(root.used_percent)}`
}

const cpuSensorKeys = [
  'coretemp_package_id_0',
  'coretemp_package_id_1',
  'coretemp_physical_id_0',
  'coretemp_physical_id_1',
  'cpu_thermal',
]

function TemperatureTile({ agent }: { agent: string }) {
  // Compute CPU and Disk temps using known sensor name hints from sensorIcons
  let cpuTemp: number | null = null
  let cpuTempStatus: 'warning' | 'critical' | null = null
  let diskTemp: number | null = null
  let diskTempStatus: 'warning' | 'critical' | null = null

  const sensorsState = store.systemInfo[agent]?.sensors.use()
  const readyState = store.readyState.use()!
  const temperatureUnit = store.temperatureUnit.use()!

  if (sensorsState) {
    // backward compatibility: sensors can be an object map
    const sensors = Array.isArray(sensorsState)
      ? sensorsState
      : (Object.values(sensorsState) as SensorsTemperatureStat[])

    for (const s of sensors) {
      if (!Number.isFinite(s.temperature)) continue
      if (diskTemp === null && s.name === 'nvme_composite') {
        diskTemp = s.temperature
        if (s.temperature >= s.critical) {
          diskTempStatus = 'critical'
        } else if (s.temperature >= s.high) {
          diskTempStatus = 'warning'
        }
      } else if (cpuTemp === null && cpuSensorKeys.includes(s.name)) {
        cpuTemp = s.temperature
        if (s.temperature >= s.critical) {
          cpuTempStatus = 'critical'
        } else if (s.temperature >= s.high) {
          cpuTempStatus = 'warning'
        }
      }
      if (diskTemp !== null && cpuTemp !== null) break
    }
  }

  const CpuTemp = !readyState ? (
    <Skeleton className="h-4 w-8" />
  ) : (
    <span
      className={cn(
        'text-xs',
        cpuTempStatus === 'critical' && 'text-error',
        cpuTempStatus === 'warning' && 'text-warning'
      )}
    >
      {cpuTemp === null ? '—' : formatTemperature(cpuTemp, temperatureUnit)}
    </span>
  )

  const DiskTemp = !readyState ? (
    <Skeleton className="h-4 w-8" />
  ) : (
    <span
      className={cn(
        'text-xs',
        diskTempStatus === 'critical' && 'text-error',
        diskTempStatus === 'warning' && 'text-warning'
      )}
    >
      {diskTemp === null ? '—' : formatTemperature(diskTemp, temperatureUnit)}
    </span>
  )

  return (
    <div className="flex flex-col items-center justify-center text-center min-w-0">
      <div className="flex items-center gap-2">
        <LucideCpu className="h-4 w-4 text-primary" />
        {CpuTemp}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <LucideHardDrive className="h-4 w-4 text-primary" />
        {DiskTemp}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">Temp</div>
    </div>
  )
}
