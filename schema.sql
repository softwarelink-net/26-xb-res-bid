-- 1. 用户与水务管理值守人员表 (Users)
CREATE TABLE IF NOT EXISTS xbres_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dept_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_PATROL_OFFICER', 'ROLE_DECISION_MAKER')),
    phone TEXT,
    patrol_badge_no TEXT NOT NULL UNIQUE,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 系统全局配置与 Feature Flags (System Configs)
CREATE TABLE IF NOT EXISTS xbres_system_configs (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 隔离防护网与防区电子桩号台账主表 (Perimeter Fence Zones Master)
CREATE TABLE IF NOT EXISTS xbres_perimeter_zones (
    id TEXT PRIMARY KEY,
    zone_code TEXT NOT NULL UNIQUE,
    zone_name TEXT NOT NULL,
    start_stake_no TEXT NOT NULL,
    end_stake_no TEXT NOT NULL,
    fence_type TEXT NOT NULL CHECK(fence_type IN ('ANTI_CLIMB_WIRE_MESH', 'TENSION_PULSE_FENCE', 'VIBRATION_FIBER_OPTIC')),
    total_length_meters REAL NOT NULL,
    bound_camera_code TEXT NOT NULL,
    arm_status TEXT DEFAULT 'ARMED' CHECK(arm_status IN ('ARMED', 'DISARMED', 'BYPASS_MAINTENANCE')),
    gps_start_coord TEXT NOT NULL,
    gps_end_coord TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 智能视频监控与入侵告警联动表 (Video AI Detection & Intrusion Alarms)
CREATE TABLE IF NOT EXISTS xbres_intrusion_alarms (
    id TEXT PRIMARY KEY,
    alarm_no TEXT NOT NULL UNIQUE,
    zone_id TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    camera_code TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('PERSON_TRESPASS', 'FISHING_ILLEGAL', 'VEHICLE_INTRUSION', 'FENCE_CUTTING')),
    ai_confidence_score REAL DEFAULT 0.94,
    snapshot_image_url TEXT NOT NULL,
    broadcast_triggered INTEGER DEFAULT 1,
    alarm_level TEXT NOT NULL CHECK(alarm_level IN ('LEVEL_BLUE_INFO', 'LEVEL_YELLOW_WARN', 'LEVEL_RED_URGENT')),
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'INSPECTING', 'CONFIRMED_EXPELLED', 'FALSE_ALARM')),
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY(zone_id) REFERENCES xbres_perimeter_zones(id)
);

-- 5. 水雨情气象与大坝水位监测时序表 (Hydrology & Dam Telemetry)
CREATE TABLE IF NOT EXISTS xbres_hydrology_records (
    id TEXT PRIMARY KEY,
    station_code TEXT NOT NULL,
    water_level_meters REAL NOT NULL,
    flood_limit_level REAL DEFAULT 485.50,
    storage_capacity_m3 REAL NOT NULL,
    inflow_rate_m3_s REAL NOT NULL,
    outflow_rate_m3_s REAL NOT NULL,
    rainfall_hourly_mm REAL NOT NULL,
    water_quality_grade TEXT DEFAULT 'GRADE_II' CHECK(water_quality_grade IN ('GRADE_I', 'GRADE_II', 'GRADE_III', 'GRADE_IV')),
    sampled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 库区巡护事件流转与防护网维修闭环表 (Patrol Incidents & Maintenance)
CREATE TABLE IF NOT EXISTS xbres_patrol_incidents (
    id TEXT PRIMARY KEY,
    incident_no TEXT NOT NULL UNIQUE,
    stake_location TEXT NOT NULL,
    incident_category TEXT NOT NULL CHECK(incident_category IN ('FENCE_DAMAGED', 'WARNING_SIGN_LOST', 'WATER_POLLUTION', 'DROWNING_RISK')),
    reporter_user_id TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    repair_action_desc TEXT,
    handler_user_name TEXT,
    disposition_status TEXT DEFAULT 'RECTIFYING' CHECK(disposition_status IN ('REPORTED', 'RECTIFYING', 'CLOSED_VERIFIED')),
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY(reporter_user_id) REFERENCES xbres_users(id)
);

-- 7. 水务安防操作审计与等保安全日志表 (Security Audit Trail)
CREATE TABLE IF NOT EXISTS xbres_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    action_name TEXT NOT NULL,
    target_resource TEXT NOT NULL,
    ip_address TEXT,
    request_uri TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 种子数据初始化 (Seed Data)
-- ==============================================================================

-- 注入演示用户 (密码哈希对应 README 演示账号)
INSERT OR REPLACE INTO xbres_users (id, username, password_hash, full_name, dept_name, role, phone, patrol_badge_no) VALUES
('u-01', 'admin', 'ce5dec5f7d5cda41bd625bd6a23bb9aa', '系统管理员', '水务信息化调度中心', 'ROLE_SUPER_ADMIN', '18784678348', 'XW-WATER-001'),
('u-02', 'director', 'f038c74d382fe8da1f410e4db5250a52', '税所长', '新坝水库管理所', 'ROLE_WATER_DIRECTOR', '18784678349', 'XW-WATER-008'),
('u-03', 'patrol', '2cc7606dec3f4a0791bcfcfa57d6283e', '蒋值班员', '库区水利执勤巡查组', 'ROLE_PATROL_OFFICER', '17318657715', 'XW-WATER-016'),
('u-04', 'leader', '5fa3c1e40a221e46fbabb44790283fc9', '局分管领导', '兴文县水利局局党组', 'ROLE_DECISION_MAKER', '0831-8832314', 'XW-LEAD-001');

-- 注入 Feature Flags 与系统全局配置
INSERT OR REPLACE INTO xbres_system_configs (config_key, config_value, category, description) VALUES
('FEATURE_AUTO_SPEAKER_BROADCAST', 'true', 'AI_LINKAGE', '视频AI识别到人员垂钓越界时自动下发联动广播语音警告'),
('FEATURE_SM4_GEO_COORDINATES_MASKING', 'true', 'SECURITY', '对大坝内部隐蔽传感器精密空间经纬度启用国密 SM4 动态脱敏'),
('WATER_LEVEL_ALARM_OFFSET_METERS', '0.50', 'HYDROLOGY', '水位距离汛限水位不足0.50米时触发橙色高危告警');

-- 注入隔离防护网防区数据
INSERT OR REPLACE INTO xbres_perimeter_zones (id, zone_code, zone_name, start_stake_no, end_stake_no, fence_type, total_length_meters, bound_camera_code, arm_status, gps_start_coord, gps_end_coord) VALUES
('zone-01', 'ZONE-XB-NORTH-01', '北岸饮用水源一级保护区隔离网', 'K0+000', 'K1+200', 'ANTI_CLIMB_WIRE_MESH', 1200.0, 'CAM-XB-PTZ-001', 'ARMED', '105.23412,28.12560', '105.23980,28.12845'),
('zone-02', 'ZONE-XB-DAM-02', '主大坝管理范围防攀爬张力网', 'K1+200', 'K2+050', 'TENSION_PULSE_FENCE', 850.0, 'CAM-XB-PTZ-002', 'ARMED', '105.23980,28.12845', '105.24410,28.13120'),
('zone-03', 'ZONE-XB-SOUTH-03', '南岸山林缓坡振动光纤防护网', 'K2+050', 'K3+800', 'VIBRATION_FIBER_OPTIC', 1750.0, 'CAM-XB-PTZ-003', 'ARMED', '105.24410,28.13120', '105.25102,28.13780'),
('zone-04', 'ZONE-XB-EAST-04', '东岸进库道路卡口防区', 'K3+800', 'K5+200', 'ANTI_CLIMB_WIRE_MESH', 1400.0, 'CAM-XB-PTZ-004', 'ARMED', '105.25102,28.13780', '105.25890,28.14210');

-- 注入智能视频入侵告警记录
INSERT OR REPLACE INTO xbres_intrusion_alarms (id, alarm_no, zone_id, zone_name, camera_code, target_type, ai_confidence_score, snapshot_image_url, broadcast_triggered, alarm_level, status) VALUES
('alm-01', 'ALM-202610-001', 'zone-01', '北岸饮用水源一级保护区隔离网', 'CAM-XB-PTZ-001', 'FISHING_ILLEGAL', 0.96, 'https://26-xb-res-bid-assets.softwarelink.net/alarms/snap_fishing_01.jpg', 1, 'LEVEL_YELLOW_WARN', 'CONFIRMED_EXPELLED'),
('alm-02', 'ALM-202610-002', 'zone-02', '主大坝管理范围防攀爬张力网', 'CAM-XB-PTZ-002', 'PERSON_TRESPASS', 0.98, 'https://26-xb-res-bid-assets.softwarelink.net/alarms/snap_climb_02.jpg', 1, 'LEVEL_RED_URGENT', 'INSPECTING'),
('alm-03', 'ALM-202610-003', 'zone-03', '南岸山林缓坡振动光纤防护网', 'CAM-XB-PTZ-003', 'FENCE_CUTTING', 0.91, 'https://26-xb-res-bid-assets.softwarelink.net/alarms/snap_fence_03.jpg', 1, 'LEVEL_RED_URGENT', 'PENDING'),
('alm-04', 'ALM-202610-004', 'zone-04', '东岸进库道路卡口防区', 'CAM-XB-PTZ-004', 'VEHICLE_INTRUSION', 0.93, 'https://26-xb-res-bid-assets.softwarelink.net/alarms/snap_vehicle_04.jpg', 0, 'LEVEL_BLUE_INFO', 'FALSE_ALARM');

-- 注入大坝水雨情遥测数据
INSERT OR REPLACE INTO xbres_hydrology_records (id, station_code, water_level_meters, flood_limit_level, storage_capacity_m3, inflow_rate_m3_s, outflow_rate_m3_s, rainfall_hourly_mm, water_quality_grade, sampled_at) VALUES
('hyd-01', 'STN-XB-DAM-01', 482.80, 485.50, 1398.2, 10.5, 8.5, 2.1, 'GRADE_II', '2026-09-18 00:00:00'),
('hyd-02', 'STN-XB-DAM-01', 482.95, 485.50, 1405.6, 11.2, 8.5, 3.0, 'GRADE_II', '2026-09-18 04:00:00'),
('hyd-03', 'STN-XB-DAM-01', 483.10, 485.50, 1412.0, 12.0, 8.5, 3.8, 'GRADE_II', '2026-09-18 08:00:00'),
('hyd-04', 'STN-XB-DAM-01', 483.25, 485.50, 1420.5, 12.8, 8.5, 4.2, 'GRADE_II', '2026-09-18 12:00:00'),
('hyd-05', 'STN-XB-DAM-01', 483.30, 485.50, 1423.8, 14.2, 8.5, 6.0, 'GRADE_II', '2026-09-18 16:00:00'),
('hyd-06', 'STN-XB-DAM-01', 483.28, 485.50, 1422.1, 13.5, 9.0, 5.2, 'GRADE_II', '2026-09-18 20:00:00'),
('hyd-07', 'STN-XB-DAM-01', 483.35, 485.50, 1426.4, 13.8, 8.8, 4.5, 'GRADE_II', '2026-09-19 00:00:00'),
('hyd-08', 'STN-XB-DAM-01', 483.42, 485.50, 1430.0, 14.5, 8.8, 3.6, 'GRADE_II', '2026-09-19 08:00:00');

-- 注入巡检隐患记录
INSERT OR REPLACE INTO xbres_patrol_incidents (id, incident_no, stake_location, incident_category, reporter_user_id, reporter_name, repair_action_desc, handler_user_name, disposition_status, reported_at, closed_at) VALUES
('inc-01', 'INC-XB-202610-001', 'K0+850', 'FENCE_DAMAGED', 'u-03', '蒋值班员', '现场发现铁丝网被外力剪开一处裂隙，已使用防锈冷镀锌钢丝绑扎复原并补装警示牌', '蒋值班员', 'CLOSED_VERIFIED', '2026-09-16 09:20:00', '2026-09-16 15:40:00'),
('inc-02', 'INC-XB-202610-002', 'K2+300', 'WATER_POLLUTION', 'u-03', '蒋值班员', '树枝树叶漂浮物聚集在泄洪涵洞进水口外侧，已通知打捞保洁队清运', '税所长', 'RECTIFYING', '2026-09-18 11:05:00', NULL),
('inc-03', 'INC-XB-202610-003', 'K1+450', 'WARNING_SIGN_LOST', 'u-03', '蒋值班员', '大坝管理范围东侧警示牌倾倒，待更换立柱后复装', NULL, 'REPORTED', '2026-09-19 08:30:00', NULL),
('inc-04', 'INC-XB-202610-004', 'K3+120', 'DROWNING_RISK', 'u-03', '蒋值班员', '发现疑似未成年人靠近深水区嬉水，已广播劝离并加强值守', '蒋值班员', 'CLOSED_VERIFIED', '2026-09-17 16:10:00', '2026-09-17 16:45:00');

-- 注入审计日志
INSERT OR REPLACE INTO xbres_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code) VALUES
('log-01', 'u-03', 'patrol', 'BROADCAST_TRIGGER', 'CAM-XB-PTZ-001', '192.168.50.22', '/api/broadcast/trigger', 200),
('log-02', 'u-02', 'director', 'ALARM_CONFIRM', 'ALM-202610-001', '192.168.50.10', '/api/alarm/confirm', 200),
('log-03', 'u-01', 'admin', 'ZONE_DISARM', 'ZONE-XB-SOUTH-03', '192.168.50.2', '/api/perimeter/disarm', 200),
('log-04', 'u-03', 'patrol', 'PTZ_MANUAL', 'CAM-XB-PTZ-002', '192.168.50.22', '/api/ptz/control', 200);
