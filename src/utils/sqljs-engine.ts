import type { Database, SqlJsStatic } from 'sql.js'

type InitSqlJs = (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>

declare global {
  interface Window {
    initSqlJs?: InitSqlJs
  }
}

async function loadInitSqlJs(): Promise<InitSqlJs> {
  if (typeof window.initSqlJs === 'function') return window.initSqlJs

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.BASE_URL}wasm/sql-wasm.js`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('无法加载 /wasm/sql-wasm.js'))
    document.head.appendChild(script)
  })

  if (typeof window.initSqlJs !== 'function') {
    throw new Error('sql.js 脚本已加载但未暴露 initSqlJs')
  }
  return window.initSqlJs
}

export type RoleCode =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_WATER_DIRECTOR'
  | 'ROLE_PATROL_OFFICER'
  | 'ROLE_DECISION_MAKER'

export interface UserRecord {
  id: string
  username: string
  full_name: string
  dept_name: string
  role: RoleCode
  phone: string | null
  patrol_badge_no: string
  status: number
}

export interface PerimeterZone {
  id: string
  zone_code: string
  zone_name: string
  start_stake_no: string
  end_stake_no: string
  fence_type: string
  total_length_meters: number
  bound_camera_code: string
  arm_status: string
  gps_start_coord: string
  gps_end_coord: string
}

export interface IntrusionAlarm {
  id: string
  alarm_no: string
  zone_id: string
  zone_name: string
  camera_code: string
  target_type: string
  ai_confidence_score: number
  snapshot_image_url: string
  broadcast_triggered: number
  alarm_level: string
  status: string
  triggered_at: string
  resolved_at: string | null
}

export interface HydrologyRecord {
  id: string
  station_code: string
  water_level_meters: number
  flood_limit_level: number
  storage_capacity_m3: number
  inflow_rate_m3_s: number
  outflow_rate_m3_s: number
  rainfall_hourly_mm: number
  water_quality_grade: string
  sampled_at: string
}

export interface PatrolIncident {
  id: string
  incident_no: string
  stake_location: string
  incident_category: string
  reporter_user_id: string
  reporter_name: string
  repair_action_desc: string | null
  handler_user_name: string | null
  disposition_status: string
  reported_at: string
  closed_at: string | null
}

export interface AuditLog {
  id: string
  user_id: string | null
  username: string | null
  action_name: string
  target_resource: string
  ip_address: string | null
  request_uri: string | null
  status_code: number | null
  created_at: string
}

export interface SystemConfig {
  config_key: string
  config_value: string
  category: string
  description: string | null
}

export interface DashboardStats {
  waterLevel: number
  floodLimit: number
  storage: number
  pendingAlarms: number
  armedZones: number
  totalZones: number
  openIncidents: number
  deviceOnlineRate: number
  patrolAttendanceRate: number
  alarmByType: { name: string; value: number }[]
  hydrologySeries: HydrologyRecord[]
  recentAlarms: IntrusionAlarm[]
  recentIncidents: PatrolIncident[]
}

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let readyPromise: Promise<void> | null = null

function md5(str: string): string {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = (a + q + x + t) | 0
    return (((a << s) | (a >>> (32 - s))) + b) | 0
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }
  function toUtf8(input: string) {
    return unescape(encodeURIComponent(input))
  }
  const msg = toUtf8(str)
  const n = msg.length
  const words: number[] = []
  for (let i = 0; i < n; i += 1) {
    words[i >> 2] |= (msg.charCodeAt(i) & 0xff) << ((i % 4) * 8)
  }
  words[n >> 2] |= 0x80 << ((n % 4) * 8)
  const bitLen = n * 8
  words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen

  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (let i = 0; i < words.length; i += 16) {
    const oa = a
    const ob = b
    const oc = c
    const od = d

    a = ff(a, b, c, d, words[i] | 0, 7, -680876936)
    d = ff(d, a, b, c, words[i + 1] | 0, 12, -389564586)
    c = ff(c, d, a, b, words[i + 2] | 0, 17, 606105819)
    b = ff(b, c, d, a, words[i + 3] | 0, 22, -1044525330)
    a = ff(a, b, c, d, words[i + 4] | 0, 7, -176418897)
    d = ff(d, a, b, c, words[i + 5] | 0, 12, 1200080426)
    c = ff(c, d, a, b, words[i + 6] | 0, 17, -1473231341)
    b = ff(b, c, d, a, words[i + 7] | 0, 22, -45705983)
    a = ff(a, b, c, d, words[i + 8] | 0, 7, 1770035416)
    d = ff(d, a, b, c, words[i + 9] | 0, 12, -1958414417)
    c = ff(c, d, a, b, words[i + 10] | 0, 17, -42063)
    b = ff(b, c, d, a, words[i + 11] | 0, 22, -1990404162)
    a = ff(a, b, c, d, words[i + 12] | 0, 7, 1804603682)
    d = ff(d, a, b, c, words[i + 13] | 0, 12, -40341101)
    c = ff(c, d, a, b, words[i + 14] | 0, 17, -1502002290)
    b = ff(b, c, d, a, words[i + 15] | 0, 22, 1236535329)

    a = gg(a, b, c, d, words[i + 1] | 0, 5, -165796510)
    d = gg(d, a, b, c, words[i + 6] | 0, 9, -1069501632)
    c = gg(c, d, a, b, words[i + 11] | 0, 14, 643717713)
    b = gg(b, c, d, a, words[i] | 0, 20, -373897302)
    a = gg(a, b, c, d, words[i + 5] | 0, 5, -701558691)
    d = gg(d, a, b, c, words[i + 10] | 0, 9, 38016083)
    c = gg(c, d, a, b, words[i + 15] | 0, 14, -660478335)
    b = gg(b, c, d, a, words[i + 4] | 0, 20, -405537848)
    a = gg(a, b, c, d, words[i + 9] | 0, 5, 568446438)
    d = gg(d, a, b, c, words[i + 14] | 0, 9, -1019803690)
    c = gg(c, d, a, b, words[i + 3] | 0, 14, -187363961)
    b = gg(b, c, d, a, words[i + 8] | 0, 20, 1163531501)
    a = gg(a, b, c, d, words[i + 13] | 0, 5, -1444681467)
    d = gg(d, a, b, c, words[i + 2] | 0, 9, -51403784)
    c = gg(c, d, a, b, words[i + 7] | 0, 14, 1735328473)
    b = gg(b, c, d, a, words[i + 12] | 0, 20, -1926607734)

    a = hh(a, b, c, d, words[i + 5] | 0, 4, -378558)
    d = hh(d, a, b, c, words[i + 8] | 0, 11, -2022574463)
    c = hh(c, d, a, b, words[i + 11] | 0, 16, 1839030562)
    b = hh(b, c, d, a, words[i + 14] | 0, 23, -35309556)
    a = hh(a, b, c, d, words[i + 1] | 0, 4, -1530992060)
    d = hh(d, a, b, c, words[i + 4] | 0, 11, 1272893353)
    c = hh(c, d, a, b, words[i + 7] | 0, 16, -155497632)
    b = hh(b, c, d, a, words[i + 10] | 0, 23, -1094730640)
    a = hh(a, b, c, d, words[i + 13] | 0, 4, 681279174)
    d = hh(d, a, b, c, words[i] | 0, 11, -358537222)
    c = hh(c, d, a, b, words[i + 3] | 0, 16, -722521979)
    b = hh(b, c, d, a, words[i + 6] | 0, 23, 76029189)
    a = hh(a, b, c, d, words[i + 9] | 0, 4, -640364487)
    d = hh(d, a, b, c, words[i + 12] | 0, 11, -421815835)
    c = hh(c, d, a, b, words[i + 15] | 0, 16, 530742520)
    b = hh(b, c, d, a, words[i + 2] | 0, 23, -995338651)

    a = ii(a, b, c, d, words[i] | 0, 6, -198630844)
    d = ii(d, a, b, c, words[i + 7] | 0, 10, 1126891415)
    c = ii(c, d, a, b, words[i + 14] | 0, 15, -1416354905)
    b = ii(b, c, d, a, words[i + 5] | 0, 21, -57434055)
    a = ii(a, b, c, d, words[i + 12] | 0, 6, 1700485571)
    d = ii(d, a, b, c, words[i + 3] | 0, 10, -1894986606)
    c = ii(c, d, a, b, words[i + 10] | 0, 15, -1051523)
    b = ii(b, c, d, a, words[i + 1] | 0, 21, -2054922799)
    a = ii(a, b, c, d, words[i + 8] | 0, 6, 1873313359)
    d = ii(d, a, b, c, words[i + 15] | 0, 10, -30611744)
    c = ii(c, d, a, b, words[i + 6] | 0, 15, -1560198380)
    b = ii(b, c, d, a, words[i + 13] | 0, 21, 1309151649)
    a = ii(a, b, c, d, words[i + 4] | 0, 6, -145523070)
    d = ii(d, a, b, c, words[i + 11] | 0, 10, -1120210379)
    c = ii(c, d, a, b, words[i + 2] | 0, 15, 718787259)
    b = ii(b, c, d, a, words[i + 9] | 0, 21, -343485551)

    a = (a + oa) | 0
    b = (b + ob) | 0
    c = (c + oc) | 0
    d = (d + od) | 0
  }

  function hex(n: number) {
    let s = ''
    for (let j = 0; j < 4; j += 1) {
      s += ((n >> (j * 8)) & 0xff).toString(16).padStart(2, '0')
    }
    return s
  }
  return hex(a) + hex(b) + hex(c) + hex(d)
}

function rowsFromExec<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) return []
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params as never[])
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return rows
}

function persistLocal() {
  if (!db) return
  try {
    const data = db.export()
    const arr = Array.from(data)
    localStorage.setItem('xbres_db_cache', JSON.stringify(arr))
  } catch {
    /* ignore quota */
  }
}

export async function initDatabase(): Promise<void> {
  if (readyPromise) return readyPromise
  readyPromise = (async () => {
    const initSqlJs = await loadInitSqlJs()
    SQL = await initSqlJs({
      locateFile: (file) => `${import.meta.env.BASE_URL}wasm/${file}`,
    })

    const cached = localStorage.getItem('xbres_db_cache')
    if (cached) {
      try {
        const bytes = new Uint8Array(JSON.parse(cached) as number[])
        db = new SQL.Database(bytes)
        return
      } catch {
        localStorage.removeItem('xbres_db_cache')
      }
    }

    const resp = await fetch('/data/xbres_database.sqlite')
    if (!resp.ok) throw new Error('无法加载本地 SQLite 数据库')
    const buf = await resp.arrayBuffer()
    db = new SQL.Database(new Uint8Array(buf))
  })()
  return readyPromise
}

export function ensureDb(): Database {
  if (!db) throw new Error('数据库尚未初始化')
  return db
}

export async function login(username: string, password: string): Promise<UserRecord | null> {
  await initDatabase()
  const hash = md5(password)
  const users = rowsFromExec<UserRecord & { password_hash: string }>(
    `SELECT id, username, password_hash, full_name, dept_name, role, phone, patrol_badge_no, status
     FROM xbres_users WHERE username = ? AND status = 1 LIMIT 1`,
    [username],
  )
  if (!users.length) return null
  const user = users[0]
  if (user.password_hash !== hash) return null
  const { password_hash: _, ...safe } = user
  void _
  writeAudit(safe.id, safe.username, 'LOGIN_SUCCESS', safe.username, '/login', 200)
  return safe
}

export function getPerimeterZones(filters?: { arm_status?: string }): PerimeterZone[] {
  ensureDb()
  if (filters?.arm_status) {
    return rowsFromExec<PerimeterZone>(
      `SELECT * FROM xbres_perimeter_zones WHERE arm_status = ? ORDER BY zone_code`,
      [filters.arm_status],
    )
  }
  return rowsFromExec<PerimeterZone>(`SELECT * FROM xbres_perimeter_zones ORDER BY zone_code`)
}

export function updateZoneArmStatus(zoneId: string, armStatus: string, operator?: UserRecord): boolean {
  ensureDb()
  db!.run(`UPDATE xbres_perimeter_zones SET arm_status = ? WHERE id = ?`, [armStatus, zoneId])
  if (operator) {
    writeAudit(operator.id, operator.username, 'ZONE_' + armStatus, zoneId, '/perimeter', 200)
  }
  persistLocal()
  return true
}

export function getIntrusionAlarms(): IntrusionAlarm[] {
  ensureDb()
  return rowsFromExec<IntrusionAlarm>(
    `SELECT * FROM xbres_intrusion_alarms ORDER BY triggered_at DESC`,
  )
}

export function updateAlarmStatus(alarmId: string, status: string, operator?: UserRecord): boolean {
  ensureDb()
  const resolved = status === 'CONFIRMED_EXPELLED' || status === 'FALSE_ALARM' ? new Date().toISOString() : null
  db!.run(`UPDATE xbres_intrusion_alarms SET status = ?, resolved_at = ? WHERE id = ?`, [
    status,
    resolved,
    alarmId,
  ])
  if (operator) {
    writeAudit(operator.id, operator.username, 'ALARM_CONFIRM', alarmId, '/video-patrol', 200)
  }
  persistLocal()
  return true
}

export function triggerBroadcast(cameraCode: string, operator?: UserRecord): boolean {
  ensureDb()
  if (operator) {
    writeAudit(operator.id, operator.username, 'BROADCAST_TRIGGER', cameraCode, '/api/broadcast/trigger', 200)
  }
  persistLocal()
  return true
}

export function getHydrologyTelemetry(): HydrologyRecord[] {
  ensureDb()
  return rowsFromExec<HydrologyRecord>(
    `SELECT * FROM xbres_hydrology_records ORDER BY sampled_at ASC`,
  )
}

export function getPatrolIncidents(): PatrolIncident[] {
  ensureDb()
  return rowsFromExec<PatrolIncident>(
    `SELECT * FROM xbres_patrol_incidents ORDER BY reported_at DESC`,
  )
}

export function getAuditLogs(): AuditLog[] {
  ensureDb()
  return rowsFromExec<AuditLog>(`SELECT * FROM xbres_audit_logs ORDER BY created_at DESC`)
}

export function getSystemConfigs(): SystemConfig[] {
  ensureDb()
  return rowsFromExec<SystemConfig>(`SELECT * FROM xbres_system_configs ORDER BY category, config_key`)
}

export function setSystemConfig(key: string, value: string, operator?: UserRecord): boolean {
  ensureDb()
  db!.run(
    `UPDATE xbres_system_configs SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?`,
    [value, key],
  )
  if (operator) {
    writeAudit(operator.id, operator.username, 'CONFIG_UPDATE', key, '/system', 200)
  }
  persistLocal()
  return true
}

function writeAudit(
  userId: string | null,
  username: string | null,
  action: string,
  target: string,
  uri: string,
  code: number,
) {
  if (!db) return
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  db.run(
    `INSERT INTO xbres_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, username, action, target, '127.0.0.1', uri, code],
  )
  persistLocal()
}

export function getDashboardStats(): DashboardStats {
  ensureDb()
  const hydrology = getHydrologyTelemetry()
  const latest = hydrology[hydrology.length - 1]
  const alarms = getIntrusionAlarms()
  const zones = getPerimeterZones()
  const incidents = getPatrolIncidents()

  const typeMap: Record<string, string> = {
    PERSON_TRESPASS: '人员越界',
    FISHING_ILLEGAL: '非法垂钓',
    VEHICLE_INTRUSION: '车辆闯入',
    FENCE_CUTTING: '破网攀爬',
  }
  const counter: Record<string, number> = {}
  alarms.forEach((a) => {
    const name = typeMap[a.target_type] || a.target_type
    counter[name] = (counter[name] || 0) + 1
  })

  return {
    waterLevel: latest?.water_level_meters ?? 0,
    floodLimit: latest?.flood_limit_level ?? 485.5,
    storage: latest?.storage_capacity_m3 ?? 0,
    pendingAlarms: alarms.filter((a) => a.status === 'PENDING' || a.status === 'INSPECTING').length,
    armedZones: zones.filter((z) => z.arm_status === 'ARMED').length,
    totalZones: zones.length,
    openIncidents: incidents.filter((i) => i.disposition_status !== 'CLOSED_VERIFIED').length,
    deviceOnlineRate: 96.5,
    patrolAttendanceRate: 92.0,
    alarmByType: Object.entries(counter).map(([name, value]) => ({ name, value })),
    hydrologySeries: hydrology,
    recentAlarms: alarms.slice(0, 6),
    recentIncidents: incidents.slice(0, 6),
  }
}

export function maskCoord(coord: string, enabled: boolean): string {
  if (!enabled) return coord
  const parts = coord.split(',')
  if (parts.length !== 2) return '***.*****,***.*****'
  return `${parts[0].slice(0, 3)}.***,${parts[1].slice(0, 2)}.***`
}
