/**
 * Session Groups — browser half.
 *
 * Registers a replacement occupant for the sidebar shell's `sidebar.workspaces`
 * single slot (priority below the shipped browser), then renders workspaces with
 * draggable sessions grouped into colored, collapsible groups.
 *
 * Groups are browser-local view state: they are namespaced by workspace id and
 * never contain a session that is not a member of that workspace. Session
 * membership, titles, archive state, and the selected session still come from
 * the Session and Workspace controllers through the slot's standard hooks.
 */

window.__ModuleLoader__.load({
  id: 'dsh-session-groups-data',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'sessionGroupsData';
    const STORAGE_KEY = 'dsh.session-groups.v1';
    const BRIDGE_GLOBAL = '__DSH_SESSION_GROUPS_DATA_BRIDGE__';
    const BRIDGE_EVENT = 'dsh-session-groups:prefs';
    const BRIDGE_TOKEN_HEADER = 'x-dsh-session-groups-data-token';
    const BRIDGE_PATH = '/dsh-session-groups-data-bridge';
    const LIVE_DATA_TTL_MS = 15000;
    const liveDataCache = new Map();
    let bridgeSnapshotProvider = null;
    let runningLightPreference = true;
    const ZH = {
      'section.title': '工作区',
      'section.loading': '正在加载工作区…',
      'section.empty': '还没有工作区',
      'section.emptySearch': '没有匹配的会话',
      'addWorkspace': '添加工作区',
      'addWorkspace.dialogTitle': '添加工作区',
      'addWorkspace.pathLabel': '目录绝对路径',
      'addWorkspace.pathPlaceholder': '例如 /home/user/project',
      'addWorkspace.confirm': '添加',
      'addWorkspace.cancel': '取消',
      'addWorkspace.invalidPath': '请输入绝对路径',
      'addWorkspace.pickerTitle': '选择工作区目录',
      'addWorkspace.useThis': '使用此目录',
      'addWorkspace.loading': '正在读取目录…',
      'addWorkspace.empty': '当前目录没有子文件夹',
      'addWorkspace.parent': '上一级',
      'addWorkspace.home': '主目录',
      'addWorkspace.pickerUnavailable': '目录选择器不可用',
      'browser.title': '选择工作区目录',
      'browser.home': '主目录',
      'browser.newFolder': '新建文件夹',
      'browser.folderName': '文件夹名称',
      'browser.createIn': '在“{name}”中新建文件夹',
      'browser.untitledFolder': '未命名文件夹',
      'browser.create': '创建',
      'browser.cancel': '取消',
      'browser.open': '打开',
      'browser.editPath': '编辑路径',
      'browser.loading': '加载中…',
      'browser.truncated': '文件夹过多，仅显示开头部分。',
      'browser.showHidden': '显示隐藏文件',
      'status.running': '进行中',
      'status.subagentsRunning.one': '{n} 个子智能体运行中',
      'status.subagentsRunning.other': '{n} 个子智能体运行中',
      'status.idle': '空闲',
      'status.waitingApproval': '等待审批',
      'status.planReview': '计划待审',
      'status.waitingAnswer': '等待回答',
      'status.compact.approval': '待审批',
      'status.compact.planReview': '计划待审',
      'status.compact.answer': '待回答',
      'status.compact.subagents': '子代理运行中',
      'status.completed': '已完成',
      'sessions.expand': '展开其余 {n} 个会话',
      'sessions.collapse': '收起',
      'notice.workspaceAdded': '已添加工作区',
      'search.open': '搜索会话',
      'search.placeholder': '搜索会话',
      'search.clear': '清除搜索',
      'newSession': '新会话',
      'newSession.aria': '在「{name}」中新建会话',
      'workspace.expand': '展开工作区',
      'workspace.collapse': '收起工作区',
      'workspace.menu': '工作区操作',
      'workspace.hideArchived': '隐藏已归档',
      'workspace.sortByTime': '按时间顺序排列',
      'workspace.rename': '重命名工作区',
      'workspace.delete': '删除工作区',
      'workspace.deleteConfirm': '确定删除工作区「{name}」？会话不会被删除。',
      'workspace.sortedByTime': '已按时间顺序排列',
      'workspace.renamed': '已重命名工作区',
      'workspace.deleted': '已删除工作区',
      'workspace.renameFailed': '重命名失败：{reason}',
      'workspace.deleteFailed': '删除失败：{reason}',
      'view.options': '视图选项',
      'view.grouped': '分组视图',
      'view.official': '原版视图',
      'view.expandAllGroups': '展开所有分组',
      'view.collapseAllGroups': '折叠所有分组',
      'view.expandAllWorkspaces': '展开所有工作区',
      'view.collapseAllWorkspaces': '折叠所有工作区',
      'view.workspaceLayout': '工作区划分',
      'view.workspaceLayout.workspace': '工作区',
      'view.workspaceLayout.tree': '工作区树',
      'view.workspaceLayout.flat': '单列表',
      'sort.byTime': '按时间顺序排序',
      'sort.byInitial': '按首字母排序',
      'sort.done.time': '已按时间顺序排序',
      'sort.done.initial': '已按首字母顺序排序',
      'view.workspaceTree': '按工作区树划分',
      'view.flatList': '单列表',
      'view.resetOrder': '恢复自动排序',
      'ungrouped': '未分组',
      'group.defaultName': '组 {n}',
      'group.aria': '分组：{name}',
      'group.count': '{n}个会话',
      'group.menu': '分组操作',
      'group.newSession': '在分组中新建会话',
      'group.rename': '重命名分组',
      'group.color': '分组颜色',
      'group.rgb': 'RGB',
      'group.rgbTitle': '自定义 RGB 颜色',
      'group.rgbApply': '应用',
      'group.rgbCancel': '取消',
      'group.rgbInvalid': '请输入 0–255 的整数',
      'subagents.expand': '展开子代理',
      'subagents.collapse': '收起子代理',
      'subagents.label': '子代理',
      'settings.nav': '会话数据',
      'settings.title': '会话数据',
      'settings.intro': '调整侧栏分组的显示方式。',
      'settings.runningLight': '运行状态使用蓝色信号灯',
      'settings.runningLightHint': '默认显示蓝色信号灯；关闭后使用转圈加载图标。',
      'settings.pricing': '费用估算价格',
      'settings.peak': '高峰',
      'settings.offPeak': '空闲',
      'settings.savePrices': '保存价格',
      'settings.holidays': '法定节假日',
      'settings.holidaysPlaceholder': '2026-10-01, 2026-10-02',
      'settings.holidaysHint': '可选，YYYY-MM-DD 逗号分隔；这些日期按空闲时段计价。',
      'settings.pricingHint': '默认填入 DeepSeek Flash 官方价格（2026-11，人民币 / 百万 tokens）；高峰为工作日 09:00–12:00、14:00–18:00（Asia/Shanghai）。缓存写没有独立官方价格，默认按未命中输入价（与其他 DSH 费用插件一致）。',
      'settings.priceInput': '输入',
      'settings.priceCacheRead': '缓存读',
      'settings.priceCacheWrite': '缓存写',
      'settings.priceOutput': '输出',
      'data.open': '数据',
      'data.activity': '活动',
      'data.aggSum': '求和',
      'data.aggAverage': '平均',
      'data.aggregationHint': '组/工作区统计：活动、Token、费用求和；上下文按会话平均。',
      'data.usage': 'Token',
      'data.steps': '步',
      'data.llmTime': '模型用时',
      'data.toolTime': '工具用时',
      'data.ttft': '首 token 平均',
      'data.speed': '输出速度',
      'data.reasoning': '推理',
      'data.system': '系统',
      'data.messages': '消息',
      'data.remaining': '剩余',
      'data.noBreakdown': '暂无上下文构成数据',
      'data.toolNoHost': '工具数据暂不可用（需重启 DSH 加载 Host 接口）',
      'data.toolHostUnavailable': '会话分组插件 Host bridge 未加载；请完整重启 DSH 后刷新页面。',
      'data.toolReadError': '工具数据读取失败；Token 统计不受影响。',
      'data.toolNonActive': '归档或非活跃会话不提供工具明细；Token 统计仍可用。',
      'data.toolSkippedNonActive': '另有 {count} 个归档/非活跃会话未计入工具统计。',
      'data.toolPartialError': '另有 {count} 个会话的工具数据读取失败。',
      'data.toolNoVisible': '该活跃会话没有可见工具或调用记录。',
      'data.title.session': '会话数据',
      'data.title.group': '组数据',
      'data.title.workspace': '工作区数据',
      'data.group': '组',
      'data.workspace': '工作区',
      'data.close': '关闭',
      'data.refresh': '刷新',
      'data.tokens': 'Tokens',
      'data.cacheHit': '缓存命中',
      'data.cacheHint': '缓存命中 = 缓存读取 /（输入 + 缓存读取 + 缓存写入）',
      'data.cost': '估算费用',
      'data.models': '模型',
      'data.modelTimeHint': '按模型选择时间段估算使用时长。',
      'data.noTimeShort': '无时长',
      'data.noUsageData': '缺少 Token 用量数据，无法显示准确统计。',
      'data.partialUsage': '部分会话缺少 Token 数据，汇总不完整。',
      'data.noStatsData': '缺少活动统计数据。',
      'data.partialStats': '部分会话缺少活动统计，汇总不完整。',
      'data.partialBreakdown': '部分会话缺少上下文构成，平均仅覆盖有数据的会话。',
      'data.noCostUsage': '缺少 Token 用量，无法计算费用。',
      'data.modelTimeUnavailable': '没有模型使用时长数据，仅显示最后已知模型。',
      'data.modelTimePartial': '部分会话缺少模型使用时长，占比不完整。',
      'data.toolSnapshot': '工具可见性来自会话请求头的历史快照，可能不是当前注册表。',
      'data.incompleteHint': '部分数据缺失、不完整或为估算值；展开对应行查看说明。',
      'data.fileSize': '会话文件',
      'data.fileEvents': '事件数',
      'data.fileSessions': '有数据会话',
      'data.fileSizeHint': '压缩后的 session.v4.jsonl.zstd 磁盘大小。',
      'data.fileSizeUnavailable': 'Host 未提供会话文件大小。',
      'data.fileSizePartial': '部分会话缺少文件大小。',
      'data.fileEventPartial': '部分会话缺少事件数。',
      'data.peak': '高峰',
      'data.offPeak': '空闲',
      'data.peakSchedule': '高峰：工作日 09:00–12:00、14:00–18:00（Asia/Shanghai）',
      'data.estimatedPeriod': '归档会话没有逐时段数据，费用按当前时段估算。',
      'data.missingPeriodPrice': '部分时段未配置价格，无法计算完整费用。',
      'data.costPartial': '部分会话缺少费用数据，总费用仅累计可计算的会话。',
      'data.noPeriodData': '部分会话缺少逐时段 Token 数据，费用无法计算。',
      'data.costDetails': '费用明细',
      'data.price': '单价',
      'data.amount': '金额',
      'data.perMillion': '¥ / 百万 tokens',
      'data.toolsAvailable': '已开放',
      'data.toolsClosed': '未开放',
      'data.noAvailableTools': '没有已开放的工具',
      'data.noClosedTools': '没有未对该会话开放的工具',
      'data.item': '项目',
      'data.context': '上下文',
      'data.sessions': '会话',
      'data.turns': '轮次',
      'data.tokenBreakdown': 'Token 明细',
      'data.input': '输入',
      'data.cacheRead': '缓存读',
      'data.cacheWrite': '缓存写',
      'data.output': '输出',
      'data.tools': '工具',
      'data.toolCalls': '调用',
      'data.toolErrors': '失败',
      'data.noTools': '暂无工具数据',
      'data.toolsLiveOnly': '仅活跃会话提供工具明细；归档会话仍保留 Token 统计。',
      'data.toolsScope': '列表包含全局注册表、当前会话可见的 scoped 工具和本会话调用记录；不包含其他 Agent 或预设的 scoped 工具。',
      'data.noPrice': '未配置价格',
      'data.priceHint': '在设置 → 会话分组中填写价格',
      'data.loading': '加载中…',
      'data.note': '数据来自会话日志，费用为估算值',
      'group.collapse': '折叠分组',
      'group.expand': '展开分组',
      'group.dissolve': '解散分组',
      'group.newSubgroup': '新建子分组',
      'group.subgroupCreated': '已新建子分组',
      'group.moveLabel': '移动到分组',
      'group.moveToGroup': '移入「{name}」',
      'group.moveOut': '移出分组',
      'group.moved': '已移动分组',
      'session.menu': '会话操作',
      'session.pin': '置顶会话',
      'session.unpin': '取消置顶',
      'session.rename': '重命名',
      'session.newGroup': '新建分组',
      'session.removeFromGroup': '从分组中移出',
      'session.moveToGroup': '移入「{name}」',
      'session.archive': '归档会话',
      'session.archived': '已归档',
      'schedule.untitled': '未命名任务',
      'schedule.mark': '有 {count} 个自动化任务',
      'schedule.more': '还有 {count} 个任务',
      'schedule.separator': ' · ',
      'schedule.relative.soon': '即将',
      'schedule.relative.minutes': '{n} 分钟后',
      'schedule.relative.hours': '{n} 小时后',
      'schedule.relative.days': '{n} 天后',
      'schedule.freq.minutely': '每分钟',
      'schedule.freq.hourly': '每小时',
      'schedule.freq.daily': '每天',
      'schedule.freq.weekly': '每周',
      'schedule.freq.monthly': '每月',
      'schedule.freq.custom': '定时',
      'session.unarchive': '取消归档',
      'session.fork': '分叉会话',
      'session.copyId': '复制 Session ID',
      'session.delete': '删除会话',
      'delete.title': '删除会话',
      'delete.current': '当前会话不能删除',
      'delete.warning': '点击「永久删除」后立即执行，且无法恢复。',
      'delete.willDo': '将执行',
      'delete.willRemove': '删除会话日志、投影缓存和工作区引用',
      'delete.willStop': '停止正在运行的会话及其子代理',
      'delete.willCascade': '同时删除 {count} 个子代理会话',
      'delete.checking': '正在检查会话…',
      'delete.children': '同时删除 {count} 个子代理会话',
      'delete.running': '会话仍在运行，停止后删除',
      'delete.confirm': '我确认永久删除',
      'delete.cancel': '取消',
      'delete.action': '永久删除',
      'delete.deleting': '删除中…',
      'delete.done': '会话已删除',
      'notice.grouped': '已放入分组',
      'notice.ungrouped': '已移出分组',
      'notice.groupDissolved': '已解散分组',
      'notice.archived': '会话已归档',
      'notice.reordered': '已调整顺序',
      'notice.groupDepthLimit': '分组最多嵌套 3 层，无法继续拖入',
      'notice.sessionCreated': '已新建会话',
      'notice.newSessionFailed': '新建会话失败：{reason}',
      'notice.sameWorkspace': '只能在本工作区内建立分组',
      'notice.dropUngroup': '拖到此处移出分组',
      'notice.copied': '已复制会话 ID',
      'notice.copyFailed': '复制失败：{reason}',
      'notice.archiveFailed': '归档失败：{reason}',
      'notice.archiveFollowupFailed': '归档后续操作失败：{reason}',
      'notice.archiveFollowupSettled': '归档后续操作已完成',
      'notice.archiveFailedUnknown': '未知原因',
      'notice.pinFailed': '置顶失败：{reason}',
      'notice.renameFailed': '重命名失败：{reason}',
      'notice.forkFailed': '分叉失败：{reason}',
      'notice.addWorkspaceFailed': '添加工作区失败：{reason}',
      'hint.drag': '拖动会话到另一个会话中段可成组；拖到上下边缘可调整顺序',
      'untitled': '未命名',
      'loading': '加载中…',
      'time.now': '刚刚',
      'time.minutes': '{n} 分钟',
      'time.hours': '{n} 小时',
      'time.days': '{n} 天',
      'status.running': '正在运行',
      'status.pending': '等待处理',
      'status.done': '有未读完成',
      'status.idle': '空闲',
    };

    const EN = {
      'section.title': 'Workspaces',
      'section.loading': 'Loading workspaces…',
      'section.empty': 'No workspaces yet',
      'section.emptySearch': 'No matching sessions',
      'addWorkspace': 'Add workspace',
      'addWorkspace.dialogTitle': 'Add workspace',
      'addWorkspace.pathLabel': 'Absolute directory path',
      'addWorkspace.pathPlaceholder': 'e.g. /home/user/project',
      'addWorkspace.confirm': 'Add',
      'addWorkspace.cancel': 'Cancel',
      'addWorkspace.invalidPath': 'Enter an absolute path',
      'addWorkspace.pickerTitle': 'Choose a workspace directory',
      'addWorkspace.useThis': 'Use this directory',
      'addWorkspace.loading': 'Reading directory…',
      'addWorkspace.empty': 'No subfolders here',
      'addWorkspace.parent': 'Up',
      'addWorkspace.home': 'Home',
      'addWorkspace.pickerUnavailable': 'Directory picker unavailable',
      'browser.title': 'Select Workspace Directory',
      'browser.home': 'Home',
      'browser.newFolder': 'New folder',
      'browser.folderName': 'Folder name',
      'browser.createIn': 'New folder in “{name}”',
      'browser.untitledFolder': 'Untitled folder',
      'browser.create': 'Create',
      'browser.cancel': 'Cancel',
      'browser.open': 'Open',
      'browser.editPath': 'Edit path',
      'browser.loading': 'Loading…',
      'browser.truncated': 'Too many folders to list; only the beginning is shown.',
      'browser.showHidden': 'Show hidden files',
      'status.running': 'Running',
      'status.subagentsRunning.one': '{n} subagent running',
      'status.subagentsRunning.other': '{n} subagents running',
      'status.idle': 'Idle',
      'status.waitingApproval': 'Waiting for approval',
      'status.planReview': 'Plan awaiting review',
      'status.waitingAnswer': 'Waiting for answer',
      'status.compact.approval': 'Approval',
      'status.compact.planReview': 'Plan review',
      'status.compact.answer': 'Answer',
      'status.compact.subagents': 'Subagent running',
      'status.completed': 'Completed',
      'sessions.expand': 'Show {n} more sessions',
      'sessions.collapse': 'Show less',
      'notice.workspaceAdded': 'Workspace added',
      'search.open': 'Search sessions',
      'search.placeholder': 'Search sessions',
      'search.clear': 'Clear search',
      'newSession': 'New session',
      'newSession.aria': 'New session in {name}',
      'workspace.expand': 'Expand workspace',
      'workspace.collapse': 'Collapse workspace',
      'workspace.menu': 'Workspace actions',
      'workspace.hideArchived': 'Hide archived',
      'workspace.sortByTime': 'Sort by time',
      'workspace.rename': 'Rename workspace',
      'workspace.delete': 'Delete workspace',
      'workspace.deleteConfirm': 'Delete workspace “{name}”? Sessions are kept.',
      'workspace.sortedByTime': 'Sorted by time',
      'workspace.renamed': 'Workspace renamed',
      'workspace.deleted': 'Workspace deleted',
      'workspace.renameFailed': 'Rename failed: {reason}',
      'workspace.deleteFailed': 'Delete failed: {reason}',
      'view.options': 'View options',
      'view.grouped': 'Grouped view',
      'view.official': 'Original view',
      'view.expandAllGroups': 'Expand all groups',
      'view.collapseAllGroups': 'Collapse all groups',
      'view.expandAllWorkspaces': 'Expand all workspaces',
      'view.collapseAllWorkspaces': 'Collapse all workspaces',
      'view.workspaceLayout': 'Workspace layout',
      'view.workspaceLayout.workspace': 'Workspace',
      'view.workspaceLayout.tree': 'Workspace tree',
      'view.workspaceLayout.flat': 'Single list',
      'sort.byTime': 'Sort by time',
      'sort.byInitial': 'Sort by initial',
      'sort.done.time': 'Sorted by time',
      'sort.done.initial': 'Sorted by initial',
      'view.workspaceTree': 'Group by workspace tree',
      'view.flatList': 'Single list',
      'view.resetOrder': 'Reset to automatic order',
      'ungrouped': 'Ungrouped',
      'group.defaultName': 'Group {n}',
      'group.aria': 'Group: {name}',
      'group.count': '{n} sessions',
      'group.menu': 'Group actions',
      'group.newSession': 'New session in group',
      'group.rename': 'Rename group',
      'group.color': 'Group color',
      'group.rgb': 'RGB',
      'group.rgbTitle': 'Custom RGB color',
      'group.rgbApply': 'Apply',
      'group.rgbCancel': 'Cancel',
      'group.rgbInvalid': 'Enter integers from 0 to 255',
      'subagents.expand': 'Show subagents',
      'subagents.collapse': 'Hide subagents',
      'subagents.label': 'Subagents',
      'settings.nav': 'Session Data',
      'settings.title': 'Session Data',
      'settings.intro': 'Adjust how session groups are displayed in the sidebar.',
      'settings.runningLight': 'Use a blue running light',
      'settings.runningLightHint': 'Blue status light is on by default; turn it off to use the spinning loader.',
      'settings.pricing': 'Cost estimate prices',
      'settings.peak': 'Peak',
      'settings.offPeak': 'Off-peak',
      'settings.savePrices': 'Save prices',
      'settings.holidays': 'Public holidays',
      'settings.holidaysPlaceholder': '2026-10-01, 2026-10-02',
      'settings.holidaysHint': 'Optional; comma-separated YYYY-MM-DD dates billed as off-peak.',
      'settings.pricingHint': 'Defaults are the DeepSeek Flash official CNY prices (2026-11) per million tokens; peak is weekdays 09:00–12:00 and 14:00–18:00 Asia/Shanghai. Cache writes use the input rate when no separate price is published.',
      'settings.priceInput': 'Input',
      'settings.priceCacheRead': 'Cache read',
      'settings.priceCacheWrite': 'Cache write',
      'settings.priceOutput': 'Output',
      'data.open': 'Data',
      'data.activity': 'Activity',
      'data.aggSum': 'sum',
      'data.aggAverage': 'avg',
      'data.aggregationHint': 'Group/workspace totals: activity, tokens, and cost are summed; context is averaged per session.',
      'data.usage': 'Token',
      'data.steps': 'Steps',
      'data.llmTime': 'LLM time',
      'data.toolTime': 'Tool time',
      'data.ttft': 'Avg TTFT',
      'data.speed': 'Output speed',
      'data.reasoning': 'Reasoning',
      'data.system': 'System',
      'data.messages': 'Messages',
      'data.remaining': 'Remaining',
      'data.noBreakdown': 'No context breakdown data',
      'data.toolNoHost': 'Tool data unavailable (restart DSH to load the Host API)',
      'data.toolHostUnavailable': 'The session-groups Host bridge is not loaded; fully restart DSH and refresh the page.',
      'data.toolReadError': 'Failed to read tool data; token totals are unaffected.',
      'data.toolNonActive': 'Archived or inactive sessions do not provide tool details; token totals remain available.',
      'data.toolSkippedNonActive': '{count} archived/inactive sessions were excluded from tool statistics.',
      'data.toolPartialError': 'Tool data failed for {count} sessions.',
      'data.toolNoVisible': 'This live session has no visible tools or tool calls.',
      'data.title.session': 'Session data',
      'data.title.group': 'Group data',
      'data.title.workspace': 'Workspace data',
      'data.group': 'Group',
      'data.workspace': 'Workspace',
      'data.close': 'Close',
      'data.refresh': 'Refresh',
      'data.tokens': 'Tokens',
      'data.cacheHit': 'Cache hit',
      'data.cacheHint': 'Cache hit = cache read / (input + cache read + cache write)',
      'data.cost': 'Est. cost',
      'data.models': 'Models',
      'data.modelTimeHint': 'Usage time is estimated from model-selection intervals.',
      'data.noTimeShort': 'no duration',
      'data.noUsageData': 'Token usage data is unavailable; accurate totals cannot be shown.',
      'data.partialUsage': 'Some sessions lack token data; the total is incomplete.',
      'data.noStatsData': 'Activity statistics are unavailable.',
      'data.partialStats': 'Some sessions lack activity statistics; the total is incomplete.',
      'data.partialBreakdown': 'Some sessions lack a context breakdown; the average covers only sessions with data.',
      'data.noCostUsage': 'Token usage is unavailable, so cost cannot be calculated.',
      'data.modelTimeUnavailable': 'No model usage-time data; only the last known model is shown.',
      'data.modelTimePartial': 'Some sessions lack model usage time; shares are incomplete.',
      'data.toolSnapshot': 'Tool visibility comes from the historical request-header snapshot and may differ from the current registry.',
      'data.incompleteHint': 'Some data is missing, incomplete, or estimated; expand the relevant row for details.',
      'data.fileSize': 'Session file',
      'data.fileEvents': 'Events',
      'data.fileSessions': 'Sessions with data',
      'data.fileSizeHint': 'Compressed on-disk size of session.v4.jsonl.zstd.',
      'data.fileSizeUnavailable': 'The Host did not provide a session file size.',
      'data.fileSizePartial': 'Some sessions lack file-size data.',
      'data.fileEventPartial': 'Some sessions lack event counts.',
      'data.peak': 'Peak',
      'data.offPeak': 'Off-peak',
      'data.peakSchedule': 'Peak: weekdays 09:00–12:00 and 14:00–18:00 Asia/Shanghai',
      'data.estimatedPeriod': 'Archived sessions have no per-period data; cost is estimated using the current period.',
      'data.missingPeriodPrice': 'Some periods have no configured price; the full cost cannot be calculated.',
      'data.costPartial': 'Some sessions lack cost data; the total includes only sessions with calculable cost.',
      'data.noPeriodData': 'Some sessions lack per-period token data, so cost cannot be calculated.',
      'data.costDetails': 'Cost details',
      'data.price': 'Price',
      'data.amount': 'Amount',
      'data.perMillion': '¥ / 1M tokens',
      'data.toolsAvailable': 'Available',
      'data.toolsClosed': 'Not available',
      'data.noAvailableTools': 'No available tools',
      'data.noClosedTools': 'No tools are withheld from this session',
      'data.item': 'Item',
      'data.context': 'Context',
      'data.sessions': 'Sessions',
      'data.turns': 'Turns',
      'data.tokenBreakdown': 'Token breakdown',
      'data.input': 'Input',
      'data.cacheRead': 'Cache read',
      'data.cacheWrite': 'Cache write',
      'data.output': 'Output',
      'data.tools': 'Tools',
      'data.toolCalls': 'calls',
      'data.toolErrors': 'errors',
      'data.noTools': 'No tool data',
      'data.toolsLiveOnly': 'Tool details are available for live sessions only; archived sessions keep token totals.',
      'data.toolsScope': 'The list covers the global registry, scoped tools visible to this session, and this session’s call history; it does not include scoped tools from other agents or presets.',
      'data.noPrice': 'No prices configured',
      'data.priceHint': 'Set them in Settings → Session Groups',
      'data.loading': 'Loading…',
      'data.note': 'Data comes from the session log; costs are estimates',
      'group.collapse': 'Collapse group',
      'group.expand': 'Expand group',
      'group.dissolve': 'Dissolve group',
      'group.newSubgroup': 'New subgroup',
      'group.subgroupCreated': 'Subgroup created',
      'group.moveLabel': 'Move to group',
      'group.moveToGroup': 'Move into “{name}”',
      'group.moveOut': 'Move out of group',
      'group.moved': 'Group moved',
      'session.menu': 'Session actions',
      'session.pin': 'Pin session',
      'session.unpin': 'Unpin session',
      'session.rename': 'Rename',
      'session.newGroup': 'New group',
      'session.removeFromGroup': 'Remove from group',
      'session.moveToGroup': 'Move into “{name}”',
      'session.archive': 'Archive session',
      'session.archived': 'Archived',
      'schedule.untitled': 'Untitled task',
      'schedule.mark': '{count} scheduled tasks',
      'schedule.more': '{count} more tasks',
      'schedule.separator': ' · ',
      'schedule.relative.soon': 'soon',
      'schedule.relative.minutes': 'in {n} min',
      'schedule.relative.hours': 'in {n} h',
      'schedule.relative.days': 'in {n} d',
      'schedule.freq.minutely': 'Every minute',
      'schedule.freq.hourly': 'Hourly',
      'schedule.freq.daily': 'Daily',
      'schedule.freq.weekly': 'Weekly',
      'schedule.freq.monthly': 'Monthly',
      'schedule.freq.custom': 'Scheduled',
      'session.unarchive': 'Unarchive session',
      'session.fork': 'Fork session',
      'session.copyId': 'Copy Session ID',
      'session.delete': 'Delete session',
      'delete.title': 'Delete session',
      'delete.current': 'Current session cannot be deleted',
      'delete.warning': 'Clicking “Delete permanently” runs immediately and cannot be undone.',
      'delete.willDo': 'Will do',
      'delete.willRemove': 'Delete the session log, projection cache, and workspace references',
      'delete.willStop': 'Stop the running session and its subagents',
      'delete.willCascade': 'Also delete {count} subagent sessions',
      'delete.checking': 'Checking session…',
      'delete.children': 'Also delete {count} subagent sessions',
      'delete.running': 'Session is still running; stop it and delete',
      'delete.confirm': 'I confirm permanent deletion',
      'delete.cancel': 'Cancel',
      'delete.action': 'Delete permanently',
      'delete.deleting': 'Deleting…',
      'delete.done': 'Session deleted',
      'notice.grouped': 'Added to group',
      'notice.ungrouped': 'Removed from group',
      'notice.groupDissolved': 'Group dissolved',
      'notice.archived': 'Session archived',
      'notice.reordered': 'Order updated',
      'notice.groupDepthLimit': 'Groups can be nested up to 3 levels',
      'notice.sessionCreated': 'Session created',
      'notice.newSessionFailed': 'Could not create session: {reason}',
      'notice.sameWorkspace': 'Groups stay inside one workspace',
      'notice.dropUngroup': 'Drop here to leave the group',
      'notice.copied': 'Session ID copied',
      'notice.copyFailed': 'Copy failed: {reason}',
      'notice.archiveFailed': 'Archive failed: {reason}',
      'notice.archiveFollowupFailed': 'Archive follow-up failed: {reason}',
      'notice.archiveFollowupSettled': 'Archive follow-up completed',
      'notice.archiveFailedUnknown': 'unknown reason',
      'notice.pinFailed': 'Pin failed: {reason}',
      'notice.renameFailed': 'Rename failed: {reason}',
      'notice.forkFailed': 'Fork failed: {reason}',
      'notice.addWorkspaceFailed': 'Could not add workspace: {reason}',
      'hint.drag': 'Drop on a session middle to group; drop on its edge to reorder',
      'untitled': 'Untitled',
      'loading': 'Loading…',
      'time.now': 'now',
      'time.minutes': '{n}m',
      'time.hours': '{n}h',
      'time.days': '{n}d',
      'status.running': 'Running',
      'status.pending': 'Waiting for you',
      'status.done': 'Unread completion',
      'status.idle': 'Idle',
    };

    const FALLBACK = ZH;

    // DeepSeek official CNY prices per 1M tokens (deepseek-flash, 2026-11).
    // Cache writes have no separate published rate; use the cache-miss input rate.
    const DEFAULT_DEEPSEEK_PRICING = {
      peak: { input: 2, cacheRead: 0.04, cacheWrite: 2, output: 8 },
      offPeak: { input: 1, cacheRead: 0.02, cacheWrite: 1, output: 4 },
      currency: 'CNY',
    };

    function defaultDeepSeekPricing() {
      return {
        peak: { ...DEFAULT_DEEPSEEK_PRICING.peak },
        offPeak: { ...DEFAULT_DEEPSEEK_PRICING.offPeak },
        currency: 'CNY',
      };
    }


    /* ── small helpers ─────────────────────────────────────────────── */

    function interpolate(text, params) {
      if (!params) return text;
      return String(text).replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
      );
    }

    function translate(key, params) {
      const text = FALLBACK[key] ?? key;
      return interpolate(text, params);
    }

    function normalizePricing(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const valuesFor = (rates) => {
        const result = {};
        for (const key of ['input', 'cacheRead', 'cacheWrite', 'output']) {
          const value = Number(rates?.[key]);
          if (rates?.[key] !== undefined && Number.isFinite(value) && value >= 0) result[key] = value;
        }
        return result;
      };
      const pricing = {
        peak: valuesFor(source.peak),
        offPeak: valuesFor(source.offPeak),
        currency: 'CNY',
      };
      if (Array.isArray(source.holidays)) {
        pricing.holidays = source.holidays.filter((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day));
      }
      return pricing;
    }

    function loadPrefs() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return { pricing: normalizePricing(parsed?.pricing) };
      } catch {
        return { pricing: normalizePricing(defaultDeepSeekPricing()) };
      }
    }

    function savePrefs(prefs) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const next = parsed && typeof parsed === 'object' ? { ...parsed } : {};
        next.pricing = prefs?.pricing ?? defaultDeepSeekPricing();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best effort */
      }
    }

    function projectionOf(list, sessionId, key) {
      const values = list?.projectionsBySession?.[sessionId]?.values
        ?? list?.byId?.[sessionId]?.projectionValues
        ?? {};
      return values[key];
    }

    function usageSummary(usage) {
      const input = Number(usage?.uncachedInputTokens ?? usage?.inputTokens ?? 0) || 0;
      const cacheRead = Number(usage?.cacheReadTokens ?? 0) || 0;
      const cacheWrite = Number(usage?.cacheWriteTokens ?? 0) || 0;
      const output = Number(usage?.outputTokens ?? 0) || 0;
      const reasoning = Number(usage?.reasoningTokens ?? 0) || 0;
      const total = input + cacheRead + cacheWrite + output;
      const cacheBase = input + cacheRead + cacheWrite;
      return {
        input,
        cacheRead,
        cacheWrite,
        output,
        reasoning,
        total,
        cacheRate: cacheBase > 0 ? cacheRead / cacheBase : 0,
      };
    }

    function periodUsage(bucket) {
      return usageSummary({
        uncachedInputTokens: bucket?.input,
        cacheReadTokens: bucket?.cacheRead,
        cacheWriteTokens: bucket?.cacheWrite,
        outputTokens: bucket?.output,
      });
    }

    function rateConfigured(rate) {
      return Boolean(rate && Number.isFinite(rate.input) && Number.isFinite(rate.output));
    }

    function pricingConfigured(pricing) {
      return rateConfigured(pricing?.peak) || rateConfigured(pricing?.offPeak);
    }

    function costOfUsage(usage, rates) {
      if (!rateConfigured(rates)) return null;
      const inputPrice = Number(rates.input) || 0;
      const cacheReadPrice = Number(rates.cacheRead) || 0;
      const cacheWritePrice = Number(rates.cacheWrite) || 0;
      const outputPrice = Number(rates.output) || 0;
      return (
        usage.input / 1e6 * inputPrice
        + usage.cacheRead / 1e6 * cacheReadPrice
        + usage.cacheWrite / 1e6 * cacheWritePrice
        + usage.output / 1e6 * outputPrice
      );
    }

    function deepSeekPeakAt(time, holidays = []) {
      const local = new Date((Number(time) || Date.now()) + 8 * 60 * 60 * 1000);
      const day = local.getUTCDay();
      const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
      const dateKey = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`;
      if (day === 0 || day === 6 || holidays.includes(dateKey)) return false;
      return (minutes >= 9 * 60 && minutes < 12 * 60) || (minutes >= 14 * 60 && minutes < 18 * 60);
    }

    function costOfPeriods(periods, pricing) {
      let total = 0;
      let any = false;
      for (const [key, rates] of [['peak', pricing?.peak], ['offPeak', pricing?.offPeak]]) {
        const usage = periods?.[key];
        if (!usage || usage.total <= 0) continue;
        const cost = costOfUsage(usage, rates);
        if (cost === null) return null;
        total += cost;
        any = true;
      }
      return any ? total : (pricingConfigured(pricing) ? 0 : null);
    }

    function formatCompactNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
      return String(Math.round(n));
    }

    function formatCost(value) {
      if (value === null || !Number.isFinite(value)) return '—';
      if (value > 0 && value < 0.0001) return '~<¥0.0001';
      return `~¥${value.toFixed(value < 0.01 ? 4 : 2)}`;
    }

    function contextRateOf(pressure) {
      const used = Number(pressure?.pressureTokens ?? pressure?.projectedTokens);
      const window = Number(pressure?.contextWindow);
      if (!Number.isFinite(used) || !Number.isFinite(window) || window <= 0) return null;
      return { used, window, rate: Math.max(0, Math.min(1, used / window)) };
    }

    async function resolveBridgeAuth() {
      const injected = window[BRIDGE_GLOBAL];
      const path = injected && typeof injected.path === 'string' ? injected.path : BRIDGE_PATH;
      try {
        const response = await fetch(`${path}/config`, { cache: 'no-store' });
        if (response.ok) {
          const config = await response.json();
          if (config && typeof config.token === 'string' && typeof config.path === 'string') {
            return { path: config.path, token: config.token };
          }
        }
      } catch {
        /* fall back to the boot-time token; the Host may predate /config */
      }
      return injected && typeof injected.token === 'string' ? injected : null;
    }

    async function fetchLiveSessionData(sessionIds, force = false, holidays = []) {
      const result = new Map();
      const ids = [...new Set((sessionIds ?? []).filter((id) => typeof id === 'string' && id.length > 0))];
      if (ids.length === 0) return { rows: result, bridge: true, failed: false };
      const holidayKey = [...new Set((holidays ?? []).filter((day) => typeof day === 'string'))].sort().join(',');
      const bridge = await resolveBridgeAuth();
      if (!bridge) return { rows: result, bridge: false, failed: true };
      let failed = false;
      const now = Date.now();
      const missing = ids.filter((id) => {
        const cached = liveDataCache.get(id);
        return force || !cached || cached.holidayKey !== holidayKey || now - cached.at > LIVE_DATA_TTL_MS;
      });
      for (const chunkStart of Array.from({ length: Math.ceil(missing.length / 100) }, (_, i) => i * 100)) {
        const chunk = missing.slice(chunkStart, chunkStart + 100);
        try {
          const response = await fetch(`${bridge.path}/data`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              [BRIDGE_TOKEN_HEADER]: bridge.token,
            },
            body: JSON.stringify({ sessionIds: chunk, holidays }),
          });
          if (!response.ok) {
            failed = true;
            for (const id of chunk) {
              liveDataCache.set(id, { at: Date.now(), holidayKey, data: { id, live: false, error: 'Host 数据接口返回错误' } });
            }
            continue;
          }
          const payload = await response.json();
          const rows = Array.isArray(payload?.sessions) ? payload.sessions : [];
          const seen = new Set();
          for (const row of rows) {
            if (!row || typeof row.id !== 'string') continue;
            seen.add(row.id);
            liveDataCache.set(row.id, { at: Date.now(), holidayKey, data: row });
          }
          for (const id of chunk) {
            if (!seen.has(id)) liveDataCache.set(id, { at: Date.now(), holidayKey, data: { id, live: false } });
          }
        } catch {
          failed = true;
          for (const id of chunk) {
            liveDataCache.set(id, { at: Date.now(), holidayKey, data: { id, live: false, error: 'Host 数据请求失败' } });
          }
        }
      }
      for (const id of ids) {
        const cached = liveDataCache.get(id);
        if (cached) result.set(id, cached.data);
      }
      return { rows: result, bridge: true, failed };
    }

    async function requestSessionDelete(payload) {
      const auth = await resolveBridgeAuth();
      if (!auth) throw new Error('会话分组插件 Host bridge 未加载；请完整重启 DSH');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(`${auth.path}/delete`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [BRIDGE_TOKEN_HEADER]: auth.token,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error) {
        if (error && error.name === 'AbortError') throw new Error('Host 响应超时，请刷新页面后重试');
        throw error;
      } finally {
        clearTimeout(timer);
      }
      const result = await response.json().catch(() => ({}));
      if (!result || result.ok !== true) {
        const error = new Error(result?.error || '删除失败');
        error.code = result?.code;
        error.details = result?.details;
        throw error;
      }
      return result;
    }

    function mergeTools(target, tools) {
      for (const tool of tools ?? []) {
        if (!tool || typeof tool.name !== 'string' || !tool.name) continue;
        const current = target.get(tool.name) ?? {
          name: tool.name,
          available: false,
          calls: 0,
          errors: 0,
          sessions: 0,
        };
        current.available = current.available || tool.available === true;
        current.calls += Number(tool.calls) || 0;
        current.errors += Number(tool.errors) || 0;
        current.sessions += 1;
        target.set(tool.name, current);
      }
    }

    function icon(children, props) {
      return h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          ...(props ?? {}),
        },
        children,
      );
    }

    const officialIcon = (children, props) => h(
      'svg',
      {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1,
        'aria-hidden': 'true',
        focusable: 'false',
        ...(props ?? {}),
      },
      children,
    );

    const IconChevron = (props) => icon(
      h('path', { d: 'm9 5 7 7-7 7' }),
      props,
    );
    // 原版工作区图标（16×16，strokeWidth 1）：收起=闭合文件夹，展开=打开文件夹。
    const folderSvg = (props, children) => h(
      'svg',
      {
        width: props.width ?? 16,
        height: props.height ?? 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1,
        'aria-hidden': 'true',
      },
      children,
    );
    const IconFolderClose = (props = {}) => folderSvg(props, [
      h('path', { key: 'f', d: 'M1.50439 3.11059C1.50439 2.55831 1.95211 2.1106 2.50439 2.1106H5.43389C5.67773 2.1106 5.91318 2.19969 6.09593 2.36113L7.71649 3.79265C7.89924 3.95409 8.1347 4.04319 8.3785 4.04319H13.4958C14.0481 4.04319 14.4958 4.4909 14.4958 5.04319V12.8894C14.4958 13.4417 14.0481 13.8894 13.4958 13.8894H2.50439C1.95211 13.8894 1.50439 13.4417 1.50439 12.8894V4.04319V3.11059Z' }),
      h('path', { key: 'line', d: 'M3.63501 7.66614H12.3647' }),
    ]);
    const IconFolderOpen = (props = {}) => folderSvg(props, [
      h('path', { key: 'a', d: 'M2.55912 7.93683C2.67584 7.49906 3.0723 7.19446 3.52536 7.19446H13.6491C14.3061 7.19446 14.7846 7.81725 14.6153 8.45209L13.4411 12.856C13.3244 13.2938 12.9279 13.5984 12.4748 13.5984H2.35113C1.69411 13.5984 1.21562 12.9756 1.38489 12.3407L2.55912 7.93683Z', fill: 'currentColor', opacity: 0.16, stroke: 'none' }),
      h('path', { key: 'b', d: 'M13.6491 6.69446C14.6346 6.69453 15.3522 7.62895 15.0983 8.58118L13.9245 12.9845C13.7494 13.6412 13.1539 14.0988 12.4743 14.0988H2.35126C1.36574 14.0988 0.648153 13.1643 0.902044 12.212L2.07587 7.80774C2.25102 7.15128 2.84567 6.69455 3.52509 6.69446H13.6491ZM3.52509 7.69446C3.29865 7.69455 3.10004 7.84674 3.04169 8.06555L1.86786 12.4698C1.78345 12.7872 2.02285 13.0988 2.35126 13.0988H12.4743C12.7007 13.0988 12.8992 12.9463 12.9577 12.7277L14.1325 8.32336C14.2171 8.00598 13.9776 7.69453 13.6491 7.69446H3.52509Z', fill: 'currentColor', stroke: 'none' }),
      h('path', { key: 'c', d: 'M4.7666 1.90137C5.13227 1.90144 5.48571 2.03525 5.75977 2.27734L7.27246 3.61328C7.36379 3.69382 7.48174 3.73828 7.60352 3.73828H12.3994C13.2276 3.73841 13.8993 4.41005 13.8994 5.23828V6.7168C13.8183 6.70327 13.735 6.69436 13.6494 6.69434H12.8994V5.23828C12.8993 4.96233 12.6754 4.73841 12.3994 4.73828H7.60352C7.23781 4.73828 6.88446 4.60438 6.61035 4.3623L5.09766 3.02637C5.00636 2.94576 4.88838 2.90144 4.7666 2.90137H2.0498C1.77366 2.90137 1.5498 3.12523 1.5498 3.40137V9.78223L0.902344 12.2119C0.648452 13.1642 1.36604 14.0986 2.35156 14.0986H2.0498C1.2214 14.0986 0.549838 13.427 0.549805 12.5986V3.40137C0.549805 2.57294 1.22138 1.90137 2.0498 1.90137H4.7666Z', fill: 'currentColor', stroke: 'none' }),
    ]);
    const IconPlus = (props) => icon(
      [h('path', { key: 'h', d: 'M12 5v14' }), h('path', { key: 'v', d: 'M5 12h14' })],
      props,
    );
    const IconSearch = (props) => officialIcon([
      h('path', { key: 'a', d: 'M6.58727 11.8586C9.55061 11.8586 11.9529 9.45637 11.9529 6.49304C11.9529 3.5297 9.55061 1.12744 6.58727 1.12744C3.62394 1.12744 1.22168 3.5297 1.22168 6.49304C1.22168 9.45637 3.62394 11.8586 6.58727 11.8586Z', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M10.2991 10.3933L14.7783 14.8725', stroke: 'currentColor' }),
    ], props);
    const IconSliders = (props) => officialIcon([
      h('path', { key: 'a', d: 'M2.3 5h5.85M12.05 5h1.65' }),
      h('circle', { key: 'b', cx: '9.95', cy: '5', r: '1.45' }),
      h('path', { key: 'c', d: 'M2.3 11h1.65M7.85 11h5.85' }),
      h('circle', { key: 'd', cx: '5.75', cy: '11', r: '1.45' }),
    ], { strokeLinecap: 'round', ...(props ?? {}) });
    const IconWorkspaceAdd = (props) => officialIcon([
      h('path', { key: 'a', d: 'M5.54492 2.06738C5.91034 2.06754 6.26318 2.20149 6.53711 2.44336L7.94043 3.68164V4.7998C7.71462 4.74105 7.50367 4.63139 7.32617 4.47461L5.87598 3.19238C5.78477 3.11185 5.66658 3.06754 5.54492 3.06738H2.94922C2.67322 3.06738 2.44946 3.29145 2.44922 3.56738V12.4326C2.44927 12.7087 2.67311 12.9326 2.94922 12.9326H12.9326C13.2086 12.9325 13.4326 12.7086 13.4326 12.4326V8.53613H14.4326V12.4326C14.4326 13.2609 13.7609 13.9325 12.9326 13.9326H2.94922C2.12083 13.9326 1.44927 13.261 1.44922 12.4326V3.56738C1.44946 2.73916 2.12094 2.06738 2.94922 2.06738H5.54492Z', fill: 'currentColor', stroke: 'none' }),
      h('path', { key: 'b', d: 'M9.75977 4.50208H14.5509', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M12.1492 6.89758L12.1492 2.10642', stroke: 'currentColor' }),
    ], props);
    const IconWorkspaceTree = (props) => officialIcon([
      h('path', { key: 'box', d: 'M14 12.05c0 .8-.65 1.45-1.46 1.45H3.46C2.65 13.5 2 12.85 2 12.05v-8.1c0-.8.65-1.45 1.46-1.45h2.4c.49 0 .94.24 1.21.65l.5.73c.27.4.73.65 1.21.65h3.76c.8 0 1.46.65 1.46 1.45v6.02Z' }),
      h('path', { key: 'branches', d: 'M8.7 8.1v3M11.2 8.1v3' }),
    ], props);
    const IconFlatList = (props) => officialIcon([
      h('path', { key: 'lines', d: 'M6 3.5h7.5M6 8h7.5M6 12.5h7.5' }),
      h('path', { key: 'dots', d: 'M2.6 3.5h.01M2.6 8h.01M2.6 12.5h.01' }),
    ], props);
    const IconNewChatCircle = (props) => officialIcon([
      h('path', { key: 'a', d: 'M2.37091 11.2501C1.58745 9.89288 1.32067 8.29835 1.61969 6.76006C1.91872 5.22177 2.76342 3.8433 3.99826 2.87846C5.2331 1.91362 6.77494 1.42737 8.33988 1.50925C9.90482 1.59113 11.3875 2.23562 12.5149 3.32406C13.6425 4.41269 14.3387 5.87206 14.4754 7.4334C14.612 8.99474 14.18 10.5529 13.2587 11.8209C12.3375 13.0888 10.9891 13.9813 9.46194 14.3337C8.18691 14.628 6.85895 14.5294 5.64989 14.0605C5.1712 13.8748 4.76962 13.4932 4.26534 13.3967C3.67413 13.2835 2.95257 13.5598 2.03794 14.3337', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M8 5V11', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M5 8H11', stroke: 'currentColor' }),
    ], props);
    const IconCheck = (props) => icon(
      h('path', { d: 'M4 12.5 9.5 18 20 6' }),
      props,
    );
    const IconTriangle = (props) => officialIcon(
      h('path', { d: 'M5.5 4.5C5.5 4.40714 5.52586 4.31612 5.57467 4.23713C5.62349 4.15815 5.69334 4.09431 5.77639 4.05279C5.85945 4.01126 5.95242 3.99368 6.0449 4.00202C6.13738 4.01036 6.22572 4.04429 6.3 4.1L10.967 7.6C11.0291 7.64657 11.0795 7.70697 11.1142 7.77639C11.1489 7.84582 11.167 7.92238 11.167 8C11.167 8.07762 11.1489 8.15418 11.1142 8.22361C11.0795 8.29303 11.0291 8.35343 10.967 8.4L6.3 11.9C6.22572 11.9557 6.13738 11.9896 6.0449 11.998C5.95242 12.0063 5.85945 11.9887 5.77639 11.9472C5.69334 11.9057 5.62349 11.8419 5.57467 11.7629C5.52586 11.6839 5.5 11.5929 5.5 11.5V4.5Z', fill: 'currentColor', stroke: 'none' }),
      props,
    );
    const IconEdit = (props) => officialIcon([
      h('path', { key: 'a', d: 'M8.85596 2.69971H4.19971C3.37141 2.69971 2.69992 3.37146 2.69971 4.19971V11.8003C2.69992 12.6285 3.37141 13.3003 4.19971 13.3003H11.8003C12.6283 13.2999 13.3001 12.6283 13.3003 11.8003V7.89893H14.3003V11.8003C14.3001 13.1806 13.1806 14.2999 11.8003 14.3003H4.19971C2.81913 14.3003 1.69992 13.1808 1.69971 11.8003V4.19971C1.69992 2.81918 2.81913 1.69971 4.19971 1.69971H8.85596V2.69971Z', fill: 'currentColor', stroke: 'none' }),
      h('path', { key: 'b', d: 'M7.7849 8.23878L13.888 2.13574', stroke: 'currentColor' }),
    ], props);
    const IconSort = (props) => officialIcon([
      h('path', { key: 'up', d: 'm5.1 6 2.9-2.9L10.9 6' }),
      h('path', { key: 'down', d: 'm5.1 10 2.9 2.9 2.9-2.9' }),
    ], props);
    const IconSortAlpha = (props) => icon([
      h('path', { key: 'a', d: 'M3.5 18L7.5 6.5L11.5 18M5.2 13.5H9.8' }),
      h('path', { key: 'z', d: 'M14.5 6.5H20.5L14.5 18H20.5' }),
    ], props);
    const IconTrash = (props) => officialIcon([
      h('path', { key: 'a', d: 'M1.28149 3.88831H14.7187', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M5.41602 3.88833V2.47962C5.41602 2.29282 5.52492 2.11366 5.71876 1.98157C5.9126 1.84948 6.17551 1.77527 6.44964 1.77527H9.55053C9.82466 1.77527 10.0876 1.84948 10.2814 1.98157C10.4753 2.11366 10.5842 2.29282 10.5842 2.47962V3.88833', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M2.57349 3.88831L3.19366 13.2943C3.21937 13.5502 3.33952 13.7872 3.53065 13.9593C3.72178 14.1313 3.97016 14.2259 4.22729 14.2246H11.7728C12.0299 14.2259 12.2783 14.1313 12.4694 13.9593C12.6605 13.7872 12.7807 13.5502 12.8064 13.2943L13.4266 3.88831', stroke: 'currentColor' }),
      h('path', { key: 'd', d: 'M6.44946 6.98926V11.1238', stroke: 'currentColor' }),
      h('path', { key: 'e', d: 'M9.55054 6.98926V11.1238', stroke: 'currentColor' }),
    ], props);
    const IconClose = (props) => icon(
      [h('path', { key: 'a', d: 'm6 6 12 12' }), h('path', { key: 'b', d: 'm18 6-12 12' })],
      props,
    );
    const IconMore = (props) => officialIcon([
      h('path', { key: 'a', d: 'M3 9C3.55228 9 4 8.55228 4 8C4 7.44772 3.55228 7 3 7C2.44772 7 2 7.44772 2 8C2 8.55228 2.44772 9 3 9Z', fill: 'currentColor' }),
      h('path', { key: 'b', d: 'M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z', fill: 'currentColor' }),
      h('path', { key: 'c', d: 'M13 9C13.5523 9 14 8.55228 14 8C14 7.44772 13.5523 7 13 7C12.4477 7 12 7.44772 12 8C12 8.55228 12.4477 9 13 9Z', fill: 'currentColor' }),
    ], props);
    const IconPin = (props) => icon(
      h('path', { d: 'M9 4h6l-.8 5.2 3.3 3.3H6.5l3.3-3.3L9 4Zm3 8.5V20' }),
      props,
    );
    const IconPinOutline = (props) => officialIcon([
      h('path', { key: 'a', d: 'M9.96976 1.70572L13.1554 3.93629L10.9019 8.12317L11.5158 11.605L10.7192 12.7427L2.52767 7.00693L3.3243 5.86922L6.80612 5.25528L9.96976 1.70572Z', stroke: 'currentColor', strokeLinejoin: 'round' }),
      h('path', { key: 'b', d: 'M6.05285 9.47511C6.27284 9.16094 6.70586 9.08458 7.02003 9.30457C7.3342 9.52455 7.41055 9.95757 7.19057 10.2717L3.98587 14.4708L3.21223 13.9291L6.05285 9.47511Z', fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconPinFill = (props) => officialIcon([
      h('path', { key: 'a', d: 'M9.96976 1.70572L13.1554 3.93629L10.9019 8.12317L11.5158 11.605L10.7192 12.7427L2.52767 7.00693L3.3243 5.86922L6.80612 5.25528L9.96976 1.70572Z', fill: 'currentColor', stroke: 'currentColor', strokeLinejoin: 'round' }),
      h('path', { key: 'b', d: 'M6.05285 9.47511C6.27284 9.16094 6.70586 9.08458 7.02003 9.30457C7.3342 9.52455 7.41055 9.95757 7.19057 10.2717L3.98587 14.4708L3.21223 13.9291L6.05285 9.47511Z', fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconArchive = (props) => officialIcon([
      h('path', { key: 'a', d: 'M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M6.5 9.5H9.5', stroke: 'currentColor' }),
    ], props);
    const IconArchiveOff = (props = {}) => {
      const rawId = typeof React.useId === 'function' ? React.useId() : 'dsg-archive-off';
      const maskId = 'dsg-archive-off-' + String(rawId).replace(/:/g, '');
      return h(
        'svg',
        {
          width: 16,
          height: 16,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          ...(props ?? {}),
        },
        h(
          'mask',
          { key: 'mask', id: maskId, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '16', height: '16' },
          h('rect', { key: 'bg', x: '0', y: '0', width: '16', height: '16', fill: 'white', stroke: 'none' }),
          h('path', { key: 'slash', d: 'm2.2 1.3 11.6 12.8', stroke: 'black', strokeWidth: 4 }),
        ),
        h(
          'g',
          { key: 'body', mask: `url(#${maskId})` },
          h('rect', { key: 'lid', x: '1.9', y: '2.1', width: '12.2', height: '3.4', rx: '1.1' }),
          h('path', { key: 'box', d: 'M2.95 5.7v4.8a2.9 2.9 0 0 0 2.9 2.9h4.3a2.9 2.9 0 0 0 2.9-2.9V5.7' }),
        ),
        h('path', { key: 'slasher', d: 'm2.2 1.3 11.6 12.8' }),
      );
    };
    const IconBranch = (props) => officialIcon([
      h('path', { key: 'a', d: 'M1.01503 8.0001L5.6964 8.0001C6.41913 8.0001 6.78049 8.0001 7.12115 7.91951C7.4232 7.84804 7.71233 7.73014 7.97821 7.57C8.27809 7.38939 8.5364 7.13669 9.05303 6.63129L11.3281 4.40564', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M1.01221 7.9999L5.6964 7.9999C6.41913 7.9999 6.78049 7.9999 7.12115 8.08049C7.4232 8.15196 7.71233 8.26986 7.97821 8.43C8.27809 8.61061 8.5364 8.86331 9.05303 9.36871L11.3281 11.5944', stroke: 'currentColor' }),
      h('circle', { key: 'c', cx: '12.4502', cy: '3.3079', r: '1.56962', stroke: 'currentColor' }),
      h('circle', { key: 'd', cx: '12.4502', cy: '12.6921', r: '1.56962', stroke: 'currentColor' }),
    ], props);
    const IconCopy = (props) => officialIcon([
      h('rect', { key: 'a', x: '1.52075', y: '4.07373', width: '10.3932', height: '10.3932', rx: '2', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z', fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconData = (props) => officialIcon([
      h('path', { key: 'a', d: 'M2.25 2.25V13.75H13.75', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M5.25 10.5V7.5M8.25 10.5V4.75M11.25 10.5V6.25', stroke: 'currentColor' }),
    ], props);
    const IconGauge = (props) => officialIcon([
      h('path', { key: 'a', d: 'M2.2 12.5a5.8 5.8 0 1 1 11.6 0', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M8 12.5 10.4 8.1', stroke: 'currentColor' }),
      h('circle', { key: 'c', cx: '8', cy: '12.5', r: '1', fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconDatabase = (props) => officialIcon([
      h('ellipse', { key: 'a', cx: '8', cy: '3.7', rx: '5', ry: '2', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M3 3.7v4.2c0 1.1 2.2 2 5 2s5-.9 5-2V3.7', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M3 8v4.2c0 1.1 2.2 2 5 2s5-.9 5-2V8', stroke: 'currentColor' }),
    ], props);
    const IconContext = (props) => officialIcon([
      h('circle', { key: 'a', cx: '8', cy: '8', r: '5.5', stroke: 'currentColor' }),
      h('circle', { key: 'b', cx: '8', cy: '8', r: '2.3', stroke: 'currentColor' }),
    ], props);
    const IconStorage = (props) => officialIcon([
      h('rect', { key: 'a', x: 2.5, y: 4.5, width: 11, height: 7, rx: 2, stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M4.5 8h5.5', stroke: 'currentColor' }),
      h('circle', { key: 'c', cx: 12, cy: 8, r: 0.8, fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconModel = (props) => officialIcon([
      h('rect', { key: 'a', x: 2.5, y: 3.5, width: 11, height: 9, rx: 2, stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M5 6.5h6M5 9.5h4', stroke: 'currentColor' }),
    ], props);
    const IconCoin = (props) => officialIcon([
      h('circle', { key: 'a', cx: '8', cy: '8', r: '5.5', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M8 4.6v6.8M10.1 6c-.4-.8-1.2-1.2-2.1-1.2-1.2 0-2 .6-2 1.4 0 .9.8 1.2 2 1.5 1.2.3 2.1.6 2.1 1.5 0 .8-.9 1.4-2.1 1.4-.9 0-1.7-.4-2.1-1.2', stroke: 'currentColor' }),
    ], props);
    const IconWrench = (props) => officialIcon([
      h('path', { key: 'a', d: 'M9.6 2.5a3.5 3.5 0 0 0-4.2 4.2L2 10.1 3.9 12l3.4-3.4a3.5 3.5 0 0 0 4.2-4.2L9.4 6.5 7.5 4.6l2.1-2.1Z', stroke: 'currentColor' }),
      h('circle', { key: 'b', cx: '3.2', cy: '12.8', r: '.7', fill: 'currentColor', stroke: 'none' }),
    ], props);
    const IconUngroup = (props) => icon(
      [h('rect', { key: 'a', x: 4, y: 4, width: 7, height: 7, rx: 1.5 }),
        h('rect', { key: 'b', x: 13, y: 13, width: 7, height: 7, rx: 1.5 }),
        h('path', { key: 'c', d: 'M13 6h7M17 3l3 3-3 3' })],
      props,
    );
    const IconGroup = (props) => icon(
      [h('rect', { key: 'a', x: 4, y: 4, width: 16, height: 6, rx: 2 }),
        h('rect', { key: 'b', x: 4, y: 14, width: 16, height: 6, rx: 2 })],
      props,
    );
    const IconGroupAdd = (props) => officialIcon([
      h('rect', { key: 'a', x: 2.5, y: 3.5, width: 11, height: 9, rx: 2, stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M8 6v4M6 8h4', stroke: 'currentColor' }),
    ], props);
    const IconGroupMove = (props) => officialIcon([
      h('rect', { key: 'a', x: 2.5, y: 3.5, width: 11, height: 9, rx: 2, stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M1 8h5M4 6l2 2-2 2', stroke: 'currentColor' }),
    ], props);

    // 官方子代理图标（16×16，strokeWidth 1），路径取自 DSH primitives。
    const IconSubagentGroup = (props) => officialIcon([
      h('path', { key: 'a', d: 'M6 8.25C7.51878 8.25 8.75 7.01878 8.75 5.5C8.75 3.98122 7.51878 2.75 6 2.75C4.48122 2.75 3.25 3.98122 3.25 5.5C3.25 7.01878 4.48122 8.25 6 8.25Z', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M1 14.5C1 11.5 3.5 10.25 6 10.25C8.5 10.25 11 11.5 11 14.5', stroke: 'currentColor' }),
      h('path', { key: 'c', d: 'M10.5 2.9C11.65 3.35 12.45 4.35 12.45 5.5C12.45 6.65 11.65 7.65 10.5 8.1', stroke: 'currentColor' }),
      h('path', { key: 'd', d: 'M12.4 10.6C13.9 11.3 15 12.6 15 14.5', stroke: 'currentColor' }),
    ], props);
    const IconSubagent = (props) => officialIcon([
      h('path', { key: 'a', d: 'M8 8.25C9.51878 8.25 10.75 7.01878 10.75 5.5C10.75 3.98122 9.51878 2.75 8 2.75C6.48122 2.75 5.25 3.98122 5.25 5.5C5.25 7.01878 6.48122 8.25 8 8.25Z', stroke: 'currentColor' }),
      h('path', { key: 'b', d: 'M2.5 14.5C2.5 11.5 5.25 10.25 8 10.25C10.75 10.25 13.5 11.5 13.5 14.5', stroke: 'currentColor' }),
    ], props);
    const IconClock = (props) => officialIcon([
      h('circle', { key: 'c', cx: '8', cy: '8', r: '5.5', fill: 'none', stroke: 'currentColor' }),
      h('path', { key: 'h', d: 'M8 4.75V8l2.2 1.35' }),
    ], props);


    /* ── styles ────────────────────────────────────────────────────── */

    const CSS = `
      .dsg-toast{position:fixed;transform:translateX(-50%);z-index:80;max-width:min(320px,calc(100vw - 32px));box-sizing:border-box;padding:8px 12px;border-radius:8px;background:var(--dsw-alias-bg-elevated);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);box-shadow:0 6px 20px rgba(0,0,0,.18);font-size:12px;line-height:18px;text-align:center;pointer-events:none}
      .dsg-root{position:relative;display:flex;flex-direction:column;flex:1;min-height:0;gap:2px;color:var(--dsw-alias-label-primary);font-size:14px}
      .dsg-header{display:flex;align-items:center;gap:2px;flex:none;height:36px;padding:0 2px 0 8px;color:var(--dsw-alias-label-tertiary)}
      .dsg-title{flex:1;min-width:0;font-size:14px;font-weight:400;line-height:20px;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dsg-iconBtn{width:28px;height:28px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsg-iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-iconBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-searchRow{display:flex;align-items:center;gap:4px;flex:none;height:36px;padding:0 2px 0 8px;margin-bottom:2px}
      .dsg-searchInput{flex:1;min-width:0;height:28px;box-sizing:border-box;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}
      .dsg-searchInput:focus{border-color:var(--dsw-alias-brand-primary)}
      .dsg-searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}
      .dsg-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:1px 2px 14px;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2) transparent;animation:dsg-wide-in 200ms var(--ds-ease-in-out, ease-in-out)}
      @keyframes dsg-wide-in{from{opacity:0}}
      @media (prefers-reduced-motion:reduce){.dsg-scroll{animation:none}}
      .dsg-workspace{display:flex;flex-direction:column;gap:1px;margin-bottom:2px}
      .dsg-wsHeader{display:flex;align-items:center;gap:7px;height:34px;margin:0 2px 0 var(--dsg-ws-row-indent,0px);padding:0 4px 0 7px;border-radius:7px;cursor:pointer;color:var(--dsw-alias-label-primary);flex:none}
      .dsg-wsHeader:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-wsHeader.selected{background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-interactive-bg-hover));box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}
      .dsg-wsHeader.selected .dsg-folder{color:var(--dsw-alias-state-business-primary)}
      .dsg-wsHeader.active .dsg-folder{color:var(--dsw-alias-state-business-primary)}
      .dsg-wsHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-folder{width:17px;height:17px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}
      .dsg-wsChevron{display:none;width:17px;height:17px;flex:none;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
      .dsg-wsChevron.open{transform:rotate(90deg)}
      .dsg-wsHeader:hover .dsg-folder,.dsg-wsHeader:focus-within .dsg-folder{display:none}
      .dsg-wsHeader:hover .dsg-wsChevron,.dsg-wsHeader:focus-within .dsg-wsChevron{display:inline-flex}
      .dsg-wsActions{display:none;align-items:center;gap:15px;flex:none}
      .dsg-wsHeader:hover .dsg-wsActions,.dsg-wsHeader:focus-within .dsg-wsActions{display:inline-flex}
      .dsg-wsAction{width:16px;height:16px;padding:0;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border-radius:3px}
      .dsg-wsAction:hover{color:var(--dsw-alias-label-primary)}
      .dsg-wsStatuses{display:inline-flex;align-items:center;gap:7px;flex:none;margin-right:1px}
      .dsg-wsStatusItem{display:inline-flex;align-items:center;gap:2px}
      .dsg-wsStatusCount{font-size:10.5px;line-height:14px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .dsg-wsName{flex:1;min-width:0;font-size:14px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dsg-wsBody{display:flex;flex-direction:column;gap:1px}
      .dsg-group{display:flex;flex-direction:column;gap:1px;margin:2px 2px 0 calc(24px + var(--dsg-ws-indent,0px))}
      .dsg-groupHeader{display:flex;align-items:center;gap:6px;height:30px;box-sizing:border-box;padding:0 5px 0 6px;border-radius:7px;cursor:pointer;flex:none;color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsg-group-color) 11%, transparent)}
      .dsg-groupHeader:hover{background:color-mix(in srgb, var(--dsg-group-color) 18%, transparent)}
      .dsg-groupHeader.selected{box-shadow:inset 0 0 0 1.5px var(--dsg-group-color)}
      .dsg-groupHeader:focus-visible{outline:2px solid var(--dsg-group-color);outline-offset:-2px}
      .dsg-groupDrop{outline:1.5px dashed var(--dsw-alias-state-business-primary);outline-offset:-1px;background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)!important}
      .dsg-groupHeader.dsg-groupDragging{opacity:.65}
      .dsg-groupHeader.dsg-dropTopBefore{box-shadow:inset 0 2px 0 var(--dsw-alias-state-business-primary)}
      .dsg-groupHeader.dsg-dropTopAfter{box-shadow:inset 0 -2px 0 var(--dsw-alias-state-business-primary)}
      .dsg-groupChevron{width:14px;height:14px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary);transition:transform .14s var(--ds-ease-in-out, ease)}
      .dsg-groupChevron.open{transform:rotate(90deg)}
      .dsg-groupDot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsg-group-color);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsg-group-color) 22%, transparent)}
      .dsg-groupSwatch{width:8px;height:8px;border-radius:2px;flex:none;background:var(--dsg-group-color)}
      .dsg-groupStatuses{display:inline-flex;align-items:center;gap:7px;flex:none;margin-right:1px}
      .dsg-groupStatusItem{display:inline-flex;align-items:center;gap:2px}
      .dsg-groupStatusCount{font-size:10.5px;line-height:14px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .dsg-groupName{flex:1;min-width:0;font-size:12.5px;font-weight:600;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dsg-groupCount{flex:none;margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:14px;white-space:nowrap}
      .dsg-groupActions{display:inline-flex;align-items:center;gap:6px;flex:none;max-width:0;overflow:hidden;opacity:0;transition:max-width .14s var(--ds-ease-in-out, ease), opacity .14s var(--ds-ease-in-out, ease)}
      .dsg-groupHeader:hover .dsg-groupActions,.dsg-groupHeader:focus-within .dsg-groupActions{max-width:42px;opacity:1}
      .dsg-groupBody{display:flex;flex-direction:column;gap:1px;margin-left:6px;padding-left:0;border-left:2px solid var(--dsg-group-color)}
      .dsg-groupHeader,.dsg-groupBody,.dsg-groupDot,.dsg-groupSwatch{--dsg-group-color:var(--dsg-group-color-light)}
      body[data-ds-dark-theme] .dsg-groupHeader,body[data-ds-dark-theme] .dsg-groupBody,body[data-ds-dark-theme] .dsg-groupDot,body[data-ds-dark-theme] .dsg-groupSwatch{--dsg-group-color:var(--dsg-group-color-dark,var(--dsg-group-color-light))}
      body[data-ds-dark-theme] .dsg-groupHeader{background:color-mix(in srgb, var(--dsg-group-color) 20%, transparent)}
      body[data-ds-dark-theme] .dsg-groupHeader:hover{background:color-mix(in srgb, var(--dsg-group-color) 30%, transparent)}
      body[data-ds-dark-theme] .dsg-groupDot{box-shadow:0 0 0 2px color-mix(in srgb, var(--dsg-group-color) 30%, transparent)}

      .dsg-groupBody>.dsg-group{margin-left:12px}
      .dsg-groupBody>.dsg-sessionRow{padding-left:26px}
      .dsg-groupBody>.dsg-sessionRow.hasStatus{padding-left:10px}
      .dsg-wsBody>.dsg-sessionRow{margin:0 2px 0 calc(24px + var(--dsg-ws-indent,0px));padding-left:10px}
      .dsg-groupBody.dsg-zoneDim{margin-left:6px}
      .dsg-sessionOverflow{width:100%;box-sizing:border-box;height:28px;flex:none;padding:0 12px 0 26px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:20px;text-align:left;cursor:pointer}
      .dsg-sessionOverflow:hover{color:var(--dsw-alias-label-secondary)}
      .dsg-wsBody>.dsg-sessionOverflow{margin:0 2px 0 calc(24px + var(--dsg-ws-indent,0px));padding-left:10px}
      .dsg-statusSlot{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:flex-start}
      .dsg-leadingSlot{width:16px;height:20px;justify-content:center;gap:0}
      .dsg-stateDot{position:relative;display:inline-block;flex:none}
      .dsg-stateDot:after{content:"";position:absolute;inset:20%;border-radius:50%;background:currentColor}
      .dsg-stateDot[data-state=done]{color:var(--dsw-alias-state-success-primary)}
      .dsg-stateDot[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}
      .dsg-stateDot[data-state=error]{color:var(--dsw-alias-state-error-primary)}
      .dsg-stateDot[data-state=idle]{color:var(--dsw-alias-state-idle-primary)}
      .dsg-stateDot[data-state=running-light]{color:var(--dsw-alias-state-business-primary)}
      .dsg-stateSpinner{flex:none;color:var(--dsw-alias-label-tertiary)}
      .dsg-stateSpinnerMotion{transform-origin:center;animation:dsg-state-dot-spin 1.5s linear infinite}
      .dsg-stateSpinnerTrack,.dsg-stateSpinnerArc{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
      .dsg-stateSpinnerTrack{opacity:.25}
      .dsg-stateSpinnerArc{stroke-dasharray:12 150;animation:dsg-state-dot-dash 1.5s ease-in-out infinite}
      @keyframes dsg-state-dot-spin{to{transform:rotate(360deg)}}
      @keyframes dsg-state-dot-dash{0%{stroke-dasharray:12 150;stroke-dashoffset:0}50%{stroke-dasharray:24 150;stroke-dashoffset:-6}to{stroke-dasharray:12 150;stroke-dashoffset:0}}
      @media(prefers-reduced-motion:reduce){.dsg-stateSpinnerMotion,.dsg-stateSpinnerArc{animation:none}.dsg-stateSpinnerArc{stroke-dasharray:18 150;stroke-dashoffset:-3}}
      .dsg-visuallyHidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
      .dsg-sessionRow{display:flex;align-items:center;gap:7px;height:30px;box-sizing:border-box;padding:0 5px 0 8px;border-radius:7px;cursor:pointer;flex:none;position:relative;min-width:0;color:var(--dsw-alias-label-primary)}
      .dsg-sessionRow:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-sessionRow.active{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-sessionRow:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-sessionRow.dsg-dropBefore::before,.dsg-sessionRow.dsg-dropAfter::after{content:"";z-index:1;background:linear-gradient(55deg,transparent calc(50% - 1px),var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px)) 0 0/5px 7px no-repeat,linear-gradient(125deg,transparent calc(50% - 1px),var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px)) 0 5px/5px 7px no-repeat,linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px/calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}
      .dsg-sessionRow.dsg-dropBefore::before{top:-7px}
      .dsg-sessionRow.dsg-dropAfter::after{bottom:-7px}
      .dsg-sessionRow.dsg-dropGroup{outline:2px dashed var(--dsw-alias-state-business-primary);outline-offset:-2px;background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent)}
      .dsg-subagentToggle{width:16px;height:16px;flex:none;display:none;align-items:center;justify-content:center;padding:0;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
      .dsg-sessionRow.hasSubagents:hover .dsg-subagentToggle,.dsg-sessionRow.hasSubagents:focus-within .dsg-subagentToggle,.dsg-sessionRow.subagents-open .dsg-subagentToggle{display:inline-flex}
      .dsg-subagentToggle:hover{color:var(--dsw-alias-label-primary)}
      .dsg-subagentToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-subagentList{display:flex;flex-direction:column;gap:1px;margin:0 2px 1px 34px;padding-left:4px;border-left:1px solid var(--dsw-alias-border-l1)}
      .dsg-wsBody>.dsg-subagentList{margin-left:calc(38px + var(--dsg-ws-indent,0px))}
      .dsg-groupBody>.dsg-subagentList{margin-left:26px}
      .dsg-flatList>.dsg-subagentList{margin-left:38px}
      .dsg-subagentRow{display:flex;align-items:center;gap:7px;height:26px;box-sizing:border-box;min-width:0;padding:0 6px 0 5px;border-radius:6px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer}
      .dsg-subagentRow:hover,.dsg-subagentRow:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);outline:none}
      .dsg-subagentRow.disabled{opacity:.6;cursor:default}
      .dsg-subagentRowIcon{flex:none;color:var(--dsw-alias-label-tertiary)}
      .dsg-subagentStatusSlot{width:14px;height:14px;flex:none;display:inline-flex;align-items:center;justify-content:center}
      .dsg-subagentRow.active{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-subagentTitle{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dsg-sessionRow.archived .dsg-titleText{color:var(--dsw-alias-label-caption)}
      .dsg-titleText{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;line-height:20px;letter-spacing:.005em}
      .dsg-titleText[data-marquee]{text-overflow:clip}
      .dsg-titleText[data-scrolled]{mask-image:linear-gradient(to right,transparent,#000 12px)}
      .dsg-titleText[data-clipped]{mask-image:linear-gradient(to left,transparent,#000 12px)}
      .dsg-titleText[data-scrolled][data-clipped]{mask-image:linear-gradient(to right,transparent,#000 12px,#000 calc(100% - 12px),transparent)}
      .dsg-time{flex:none;margin-left:2px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:14px;white-space:nowrap}
      .dsg-rowMore{width:22px;height:22px;flex:none;display:none;align-items:center;justify-content:center;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsg-sessionRow:hover .dsg-rowMore,.dsg-sessionRow:focus-within .dsg-rowMore{display:inline-flex}
      @media (hover:none){.dsg-sessionRow .dsg-rowMore{display:inline-flex}.dsg-sessionRow .dsg-rowAction{display:none}}
      .dsg-hoverCard{position:fixed;z-index:75;box-sizing:border-box;padding:12px 16px;border-radius:var(--dsw-radius-lg,12px);background:#2c2c2e;box-shadow:var(--dsw-shadow-lv3,0 8px 28px rgb(0 0 0 / .28));color:var(--dsw-alias-hovercard-label-primary,#fff);display:flex;flex-direction:column;gap:8px;pointer-events:auto}
      .dsg-hoverTitle{font-size:14px;line-height:20px;font-weight:400;color:var(--dsw-alias-hovercard-label-primary,#fff);overflow-wrap:break-word}
      .dsg-hoverPath{color:var(--dsw-alias-hovercard-label-secondary,rgb(255 255 255 / .72));font-size:12px;line-height:16px;overflow-wrap:anywhere;word-break:break-all}
      .dsg-hoverTime{color:var(--dsw-alias-hovercard-label-secondary,rgb(255 255 255 / .72));font-size:12px;line-height:16px}
      .dsg-hoverStatus{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-hovercard-label-tertiary,rgb(255 255 255 / .52));font-size:12px;line-height:20px}
      .dsg-hoverArchived{color:var(--dsw-alias-hovercard-label-tertiary,rgb(255 255 255 / .52))}
      .dsg-hoverTasks{display:flex;flex-direction:column;gap:8px}
      .dsg-hoverTask{display:flex;align-items:flex-start;gap:8px;min-width:0}
      .dsg-hoverTaskIcon{flex:none;display:inline-flex;align-items:center;height:16px;color:var(--dsw-alias-hovercard-label-secondary,rgb(255 255 255 / .72))}
      .dsg-hoverTaskBody{display:flex;flex-direction:column;gap:2px;min-width:0}
      .dsg-hoverTaskName{font-size:12px;line-height:16px;color:var(--dsw-alias-hovercard-label-primary,#fff);overflow-wrap:anywhere}
      .dsg-hoverTaskTime{font-size:12px;line-height:16px;color:var(--dsw-alias-hovercard-label-secondary,rgb(255 255 255 / .72));overflow-wrap:anywhere}
      .dsg-hoverTaskMore{font-size:12px;line-height:16px;color:var(--dsw-alias-hovercard-label-tertiary,rgb(255 255 255 / .52))}
      .dsg-rowMore:hover{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
      .dsg-ungroupedZone{display:flex;flex-direction:column;gap:1px;min-height:4px;border-radius:7px;margin-top:1px;padding:0}
      .dsg-ungroupedZone>.dsg-sessionRow{margin:0 2px 0 24px;padding-left:10px}
      .dsg-ungroupedZone.dsg-zoneHint{min-height:30px;border:1px dashed var(--dsw-alias-border-l2);align-items:center;justify-content:center}
      .dsg-ungroupedZone.dsg-zoneDrop{border-color:transparent;background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent)}
      .dsg-ungroupedZone.dsg-zoneDropEnd{box-shadow:inset 0 2px 0 var(--dsw-alias-state-business-primary)}
      .dsg-zoneText{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;padding:6px 0}
      .dsg-flatList{display:flex;flex-direction:column;gap:2px;padding:1px 0 8px}
      .dsg-flatList>.dsg-sessionRow{margin:0 2px 0 24px;padding-left:10px}
      .dsg-empty{padding:26px 16px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;display:flex;flex-direction:column;align-items:center;gap:10px}
      .dsg-emptyAction{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
      .dsg-emptyAction:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-viewToggle{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsg-viewToggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-viewToggle[aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
      .dsg-viewToggle.wide{width:28px}
      .dsg-modalBackdrop{position:fixed;inset:0;z-index:95;background:rgb(0 0 0 / .24);display:flex;align-items:flex-start;justify-content:center;padding-top:16vh}
      .dsg-modal{width:380px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:0 18px 48px rgb(0 0 0 / .24);color:var(--dsw-alias-label-primary)}
      .dsg-modalTitle{font-size:14px;font-weight:600;line-height:20px;margin-bottom:14px}
      .dsg-modalLabel{display:block;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);margin-bottom:6px}
      .dsg-modalInput{width:100%;height:32px;box-sizing:border-box;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}
      .dsg-modalInput:focus{border-color:var(--dsw-alias-state-business-primary)}
      .dsg-modalInput:disabled{opacity:.6}
      .dsg-modalError{margin-top:8px;color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:16px;overflow-wrap:break-word}
      .dsg-modalActions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:16px}
      .dsg-modalButton{height:30px;padding:0 13px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
      .dsg-modalButton:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-modalButton.primary{border-color:transparent;background:var(--dsw-alias-state-business-primary);color:#fff}
      .dsg-modalButton.primary:hover{background:var(--dsw-alias-state-business-primary);opacity:.9}
      .dsg-modalButton:disabled{opacity:.55;cursor:default}
      .dsg-modal.dsg-picker{width:680px;height:min(500px,calc(100vh - 80px));display:flex;flex-direction:column}
      .dsg-pickerPathRow{display:flex;align-items:center;gap:6px;flex:none;margin-bottom:8px}
      .dsg-pickerPathInput{flex:1;min-width:0;height:30px;box-sizing:border-box;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;outline:none}
      .dsg-pickerPathInput:focus{border-color:var(--dsw-alias-state-business-primary)}
      .dsg-pickerIconButton{width:30px;height:30px;flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:inherit;font-size:14px;cursor:pointer}
      .dsg-pickerIconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-pickerIconButton:disabled{opacity:.4;cursor:default}
      .dsg-pickerCrumbs{display:flex;align-items:center;gap:2px;flex-wrap:nowrap;overflow-x:auto;flex:none;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid var(--dsw-alias-border-l1);scrollbar-width:thin}
      .dsg-pickerCrumb{flex:none;max-width:150px;height:24px;padding:0 6px;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
      .dsg-pickerCrumb:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-pickerCrumb.current{color:var(--dsw-alias-label-primary)}
      .dsg-pickerCrumb:disabled{opacity:.6;cursor:default}
      .dsg-pickerList{flex:1;min-height:0;overflow-y:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);padding:4px;display:flex;flex-direction:column;gap:1px;scrollbar-width:thin}
      .dsg-pickerEntry{display:flex;align-items:center;gap:8px;height:32px;padding:0 9px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
      .dsg-pickerEntry:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-pickerEntry:disabled{opacity:.6;cursor:default}
      .dsg-pickerEntryIcon{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}
      .dsg-pickerEntryName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dsg-pickerEmpty{display:flex;flex:1;align-items:center;justify-content:center;padding:18px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.dsgDir_dialog.dsgDir_dialog{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);gap:0;width:min(680px,100%);height:min(500px,100dvh - 32px);padding:0}.dsgDir_editorScope{display:contents}.dsgDir_header{border-bottom:.5px solid var(--dsw-alias-border-l3);flex-direction:column;flex:none;gap:8px;padding:16px 14px 8px 24px;display:flex}.dsgDir_title{min-height:28px;color:var(--dsw-alias-label-primary);align-items:flex-end;margin:0;font-size:16px;font-weight:510;line-height:24px;display:flex}.dsgDir_crumbBar{box-sizing:border-box;border-radius:var(--dsw-radius-sm);border:1px solid #0000;align-items:center;gap:4px;min-height:24px;margin-left:-9px;padding:0 8px;display:flex}.dsgDir_crumbBar:has(.dsgDir_crumbEditZone:enabled:hover),.dsgDir_crumbBar:has(.dsgDir_crumbEditZone:focus-visible),.dsgDir_crumbBar:has(.dsgDir_pathInput){border-color:var(--dsw-alias-border-l2)}.dsgDir_millerRow{scrollbar-width:none;flex:1 1 0;align-items:stretch;gap:12px;min-height:0;display:flex;overflow-x:auto}.dsgDir_crumbTrail{scrollbar-width:none;flex:0 auto;align-items:center;gap:4px;min-width:0;display:flex;overflow-x:auto}.dsgDir_crumbSeat{flex:none;align-items:center;gap:4px;min-width:0;display:inline-flex}.dsgDir_crumb{text-overflow:ellipsis;white-space:nowrap;max-width:160px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;padding:0;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.dsgDir_crumb:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}.dsgDir_crumb:hover{color:var(--dsw-alias-label-primary)}.dsgDir_crumbChevron{color:var(--dsw-alias-label-tertiary);flex:none}.dsgDir_crumbEditZone{cursor:text;background:0 0;border:none;outline:none;flex:1 0 34px;justify-content:flex-end;align-items:center;min-width:34px;height:22px;padding:0;display:flex}.dsgDir_crumbEditGlyph{color:var(--dsw-alias-label-tertiary);flex:none}.dsgDir_crumbEditZone:enabled:hover .dsgDir_crumbEditGlyph,.dsgDir_crumbEditZone:focus-visible .dsgDir_crumbEditGlyph{color:var(--dsw-alias-label-primary)}.dsgDir_crumbEditZone:disabled{cursor:default}.dsgDir_crumbEditZone:disabled .dsgDir_crumbEditGlyph{color:var(--dsw-alias-label-caption)}.dsgDir_pathInput{box-sizing:border-box;min-width:0;height:22px;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1 1 0;padding:0;font-size:13px;line-height:20px}.dsgDir_content{flex-direction:column;flex:1 1 0;min-height:0;padding:16px 16px 16px 24px;display:flex;position:relative}.dsgDir_column{flex-direction:column;flex:1 1 0;gap:2px;min-width:256px;padding-right:8px;display:flex;overflow-y:auto}.dsgDir_divider{background:var(--dsw-alias-border-l3);flex:none;width:.5px}.dsgDir_rowSeat{flex:none;display:flex}.dsgDir_row{border-radius:var(--dsw-radius-sm);text-align:left;cursor:pointer;background:0 0;border:none;flex:none;align-items:center;gap:4px;width:100%;height:28px;padding:4px;display:flex}.dsgDir_row:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}.dsgDir_row:hover{background:var(--dsw-alias-interactive-bg-hover)}.dsgDir_rowSelected,.dsgDir_rowSelected:hover{background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-interactive-bg-hover))}.dsgDir_rowIcon{color:var(--dsw-alias-label-secondary);flex:none}.dsgDir_rowIconSelected{color:var(--dsw-alias-button-info-fill);flex:none}.dsgDir_rowName{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1 1 0;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.dsgDir_rowChevron{color:var(--dsw-alias-label-tertiary);flex:none}.dsgDir_status,.dsgDir_error{padding:4px 120px 4px 4px;font-size:12px;line-height:18px}.dsgDir_status{color:var(--dsw-alias-label-secondary)}.dsgDir_error{color:var(--dsw-alias-state-error-primary)}.dsgDir_loadingFloat{background:var(--dsw-alias-bg-layer-2);padding:2px 8px;position:absolute;bottom:8px;right:16px}.dsgDir_footerBar{border-top:.5px solid var(--dsw-alias-border-l3);flex-wrap:wrap;flex:none;align-items:center;gap:8px;padding:16px 24px;display:flex}.dsgDir_showHiddenToggle{color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:none;align-items:center;gap:4px;padding:0;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}.dsgDir_showHiddenToggle:hover{color:var(--dsw-alias-label-primary)}.dsgDir_showHiddenToggle:disabled{color:var(--dsw-alias-label-caption);cursor:default}.dsgDir_showHiddenToggleActive{color:var(--dsw-alias-label-primary)}.dsgDir_footerGap{flex:1 1 0}.dsgDir_footerAction{min-width:72px}.dsgDir_createDialog.dsgDir_createDialog{gap:0;width:min(380px,100%);padding:0}.dsgDir_createBody{flex-direction:column;gap:12px;padding:22px 24px 20px;display:flex}.dsgDir_createTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:510;line-height:24px}.dsgDir_createIn{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;line-height:22px}.dsgDir_createInput{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-lg);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;outline:none;padding:7px 14px;font-size:14px;line-height:22px}.dsgDir_createInput::placeholder{color:var(--dsw-alias-label-caption)}.dsgDir_createActions{justify-content:flex-end;align-items:center;gap:8px;margin-top:8px;display:flex}

      .dsgDir_backdrop{position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;padding:16px;background:rgb(0 0 0 / .3)}
      .dsgDir_panel{position:relative;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:0 24px 64px rgb(0 0 0 / .28);color:var(--dsw-alias-label-primary)}
      .dsgDir_btn{box-sizing:border-box;height:32px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 14px;border:1px solid transparent;border-radius:8px;font:inherit;font-size:13px;font-weight:500;line-height:20px;cursor:pointer;white-space:nowrap}
      .dsgDir_btn:disabled{opacity:.5;cursor:default}
      .dsgDir_btnOutline{border-color:var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}
      .dsgDir_btnOutline:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
      .dsgDir_btnPrimary{border-color:transparent;background:var(--dsw-alias-state-business-primary);color:#fff}
      .dsgDir_btnPrimary:hover:not(:disabled){opacity:.9}
      .dsgDir_footerAction{min-width:72px}
      .dsgDir_createBackdrop{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;padding:16px;background:rgb(0 0 0 / .24);border-radius:12px}
      .dsgDir_createPanel{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-overlay);box-shadow:0 18px 48px rgb(0 0 0 / .28);color:var(--dsw-alias-label-primary)}
      .dsg-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding:2px 0 8px}
      .dsg-railBtn{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
      .dsg-railBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-railBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-editInput{flex:1;min-width:0;height:22px;box-sizing:border-box;padding:0 5px;border:1px solid var(--dsw-alias-brand-primary);border-radius:5px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;font-weight:600;outline:none}
      .dsg-menu{position:fixed;z-index:80;min-width:214px;max-width:300px;max-height:312px;overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 28px rgb(0 0 0 / .22);color:var(--dsw-alias-label-primary)}
      .dsg-menuItem{display:flex;align-items:center;gap:8px;width:100%;height:29px;box-sizing:border-box;padding:0 8px;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
      .dsg-menuItem:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-menuItem:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-menuItem.danger{color:var(--dsw-alias-state-error-primary)}
      .dsg-menuItem.danger .dsg-menuIcon{color:var(--dsw-alias-state-error-primary)}
      .dsg-menuItem.disabled{opacity:.45;cursor:default}
      .dsg-submenuTrigger .dsg-submenuChevron{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:15px;line-height:18px;flex:none}
      .dsg-submenuTrigger.open{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-submenu{position:fixed;z-index:95;min-width:190px;max-width:280px;max-height:300px;overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 28px rgb(0 0 0 / .22);color:var(--dsw-alias-label-primary);scrollbar-width:thin}
      .dsg-menuItem.danger:hover,.dsg-menuItem.danger:focus-visible{background:var(--dsw-alias-interactive-bg-hover-danger)}
      .dsg-menuIcon{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary)}
      .dsg-menuLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
      .dsg-menuCheck{flex:none;margin-left:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-primary)}
      .dsg-menuShortcut{flex:none;margin-left:12px;color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:14px;white-space:nowrap}
      .dsg-rowAction{width:22px;height:22px;flex:none;display:none;align-items:center;justify-content:center;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsg-rowTrailing,.dsg-leadingSlot,.dsg-rowExternalActions{display:inline-flex;align-items:center;gap:4px;flex:none;color:var(--dsw-alias-label-tertiary)}
      .dsg-leadingSlot:empty,.dsg-rowExternalActions:empty{display:none}
      .dsg-sessionRow:hover .dsg-rowAction,.dsg-sessionRow:focus-within .dsg-rowAction{display:inline-flex}
      .dsg-rowAction:hover{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}
      .dsg-sessionRow:hover .dsg-time,.dsg-sessionRow:focus-within .dsg-time{display:none}
      .dsg-menuLabelText{padding:4px 8px 2px;color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:14px;white-space:nowrap}
      .dsg-menuField{display:flex;align-items:center;gap:8px;min-height:30px;padding:0 8px;color:var(--dsw-alias-label-primary);font-size:12.5px;white-space:nowrap}
      .dsg-menuFieldLabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
      .dsg-layoutOptions{display:inline-flex;align-items:center;gap:2px;flex:none}
      .dsg-layoutOption{display:inline-flex;align-items:center;gap:1px}
      .dsg-layoutBtn{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .dsg-layoutBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-layoutBtn[aria-pressed=true]{color:var(--dsw-alias-state-business-primary)}
      .dsg-layoutBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .dsg-layoutCheck{width:12px;height:12px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-primary)}
      .dsg-menuScroll{max-height:120px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2) transparent;margin:0 -2px;padding:0 2px}
      .dsg-menuSeparator{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l1)}
      .dsg-swatches{display:flex;align-items:center;gap:6px;padding:3px 9px 6px;flex-wrap:wrap}
      .dsg-swatch{width:17px;height:17px;padding:0;border-radius:50%;border:2px solid transparent;background:var(--dsg-swatch-color-light);cursor:pointer;flex:none}
      body[data-ds-dark-theme] .dsg-swatch{background:var(--dsg-swatch-color-dark,var(--dsg-swatch-color-light))}
      .dsg-rgbTrigger{height:17px;flex:none;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:9.5px;line-height:15px;letter-spacing:.03em;cursor:pointer}
      .dsg-rgbTrigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-rgbTrigger.selected{border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary)}
      .dsg-rgbTrigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
      .dsg-rgbEditor{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:3px 9px 7px;border-top:1px solid var(--dsw-alias-border-l1)}
      .dsg-rgbPreview{width:18px;height:18px;flex:none;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box}
      .dsg-rgbFields{display:flex;align-items:center;gap:5px;flex:1;min-width:0}
      .dsg-rgbField{display:flex;align-items:center;gap:3px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px}
      .dsg-rgbInput{width:35px;height:22px;box-sizing:border-box;padding:0 3px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;line-height:20px;text-align:center;outline:none}
      .dsg-rgbInput:focus{border-color:var(--dsw-alias-state-business-primary)}
      .dsg-rgbActions{display:flex;align-items:center;gap:4px;flex:none;margin-left:auto}
      .dsg-rgbAction{height:22px;padding:0 8px;border:none;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;line-height:22px;cursor:pointer}
      .dsg-rgbAction:hover{background:var(--dsw-alias-interactive-bg-active)}
      .dsg-rgbAction.primary{background:var(--dsw-alias-button-info-fill);color:#fff}
      .dsg-rgbAction.primary:hover{filter:brightness(1.06)}
      .dsg-rgbError{flex-basis:100%;color:var(--dsw-alias-state-error-primary);font-size:10.5px;line-height:14px;padding-left:24px}
      .dsg-swatch.selected{border-color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-bg-overlay)}
      .dsg-settingsPage{display:flex;flex-direction:column;gap:0;width:100%;max-width:760px;padding:4px 0 16px}
      .dsg-settingsTitle{margin:0 0 6px;color:var(--dsw-alias-label-primary);font-size:16px;line-height:24px;font-weight:600}
      .dsg-settingsIntro{margin:0 0 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
      .dsg-settingsRow{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-settingsMain{display:flex;flex-direction:column;gap:4px;min-width:0}
      .dsg-settingsLabelRow{display:flex;align-items:center;gap:8px;min-width:0}
      .dsg-settingsPreviewStatus{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;flex:none}
      .dsg-settingsLabel{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
      .dsg-settingsHint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;max-width:560px}
      .dsg-switch{position:relative;width:36px;height:20px;flex:none;box-sizing:border-box;margin-top:1px;padding:0;border:none;border-radius:999px;background:var(--dsw-alias-border-l2);cursor:pointer;transition:background .15s ease}
      .dsg-switch[aria-checked=true]{background:var(--dsw-alias-state-business-primary)}
      .dsg-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
      .dsg-switchThumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 2px rgb(0 0 0 / .18);transition:transform .15s ease}
      .dsg-switch[aria-checked=true] .dsg-switchThumb{transform:translateX(16px)}
      .dsg-settingsPage .dsg-stateSpinner{color:var(--dsw-alias-label-tertiary)}
      .dsg-priceModes{display:flex;gap:3px;width:fit-content;margin-top:9px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-2)}
      .dsg-priceMode{height:23px;padding:0 9px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:10.5px;line-height:23px;cursor:pointer;white-space:nowrap}
      .dsg-priceMode:hover{color:var(--dsw-alias-label-primary)}
      .dsg-priceMode.active{background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgb(0 0 0 / .08)}
      .dsg-priceMode:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
      .dsg-priceGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;margin-top:10px}
      .dsg-priceSave{align-self:flex-start;margin-top:9px;padding:5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;line-height:16px;cursor:pointer}
      .dsg-priceSave:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-holidayField{display:flex;align-items:center;gap:8px;width:100%;margin-top:9px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
      .dsg-holidayField .dsg-priceInput{flex:1;min-width:0}
      .dsg-priceField{display:flex;flex-direction:column;gap:4px;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
      .dsg-priceInput{width:100%;height:30px;box-sizing:border-box;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;outline:none}
      .dsg-priceInput:focus{border-color:var(--dsw-alias-state-business-primary)}
      .dsg-deleteOverlay{position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;padding:24px;background:rgb(0 0 0 / .28)}
      .dsg-deletePanel{width:min(430px,100%);box-sizing:border-box;padding:18px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 18px 50px rgb(0 0 0 / .28)}
      .dsg-deleteTitle{font-size:15px;line-height:22px;font-weight:600}
      .dsg-deleteTarget{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;overflow-wrap:anywhere}
      .dsg-deleteWarning{margin:12px 0 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
      .dsg-deleteMuted{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px;margin-bottom:8px}
      .dsg-deleteOperations{margin:10px 0 4px;padding:9px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-2)}
      .dsg-deleteOperationsTitle{color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;font-weight:600;margin-bottom:4px}
      .dsg-deleteOperation{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px}
      .dsg-deleteOption{display:flex;align-items:flex-start;gap:8px;padding:6px 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer}
      .dsg-deleteOption input{margin:3px 0 0;accent-color:var(--dsw-alias-state-error-primary)}
      .dsg-deleteError{margin-top:8px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:17px;overflow-wrap:anywhere}
      .dsg-deleteSafety{margin:9px 0 4px;padding:7px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;font-size:11px;line-height:17px}
      .dsg-deleteSafety.ok{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 7%,transparent)}
      .dsg-deleteSafety.fail{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent)}
      .dsg-deleteSafetyTitle{font-weight:600}
      .dsg-deleteSafetyList{margin-top:3px;color:var(--dsw-alias-label-secondary);font-size:10.5px;line-height:16px}
      .dsg-deleteActions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
      .dsg-deleteButton{height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
      .dsg-deleteButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-deleteButton.danger{border-color:transparent;background:var(--dsw-alias-state-error-primary);color:#fff}
      .dsg-deleteButton.danger:hover:not(:disabled){filter:brightness(1.06);background:var(--dsw-alias-state-error-primary)}
      .dsg-deleteButton:disabled{opacity:.45;cursor:default}
      .dsg-deleteButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
      .dsg-dataOverlay{position:fixed;inset:0;z-index:100;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:24px;background:rgb(0 0 0 / .22)}
      .dsg-dataPanel{display:flex;flex-direction:column;width:min(540px,100%);max-height:min(760px,calc(100vh - 48px));overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 18px 50px rgb(0 0 0 / .24)}
      .dsg-statList{display:flex;flex-direction:column}
      .dsg-statRow{border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-statRow:first-child{border-top:1px solid var(--dsw-alias-border-l1)}
      .dsg-statHeader{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:10px 2px;border:none;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      .dsg-statHeader:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dsg-statHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;border-radius:5px}
      .dsg-statIcon{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
      .dsg-statIcon svg{width:14px;height:14px}
      .dsg-statLabel{width:58px;flex:none;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;white-space:nowrap}
      .dsg-statAgg{flex:none;margin-left:-5px;padding:0 4px;border:1px solid var(--dsw-alias-border-l1);border-radius:3px;color:var(--dsw-alias-label-tertiary);font-size:9px;line-height:14px;white-space:nowrap}
      .dsg-statValue{display:flex;align-items:center;justify-content:flex-end;gap:5px;flex:1;min-width:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dsg-statChevron{width:12px;flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px;text-align:center}
      .dsg-statBody{padding:0 2px 10px 74px}
      .dsg-statBar{display:flex;width:100%;height:5px;gap:1px;margin:2px 0 9px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);overflow:hidden}
      .dsg-statSegment{min-width:2px;height:100%;flex:none;border-radius:1px}
      .dsg-segInput{background:var(--dsw-static-blue-450,#4d6bfe)}
      .dsg-segCacheRead{background:var(--dsw-static-neutral-bluish-400,#94a3b8)}
      .dsg-segCacheWrite{background:#a78bfa}
      .dsg-segOutput{background:var(--dsw-alias-state-success-primary)}
      .dsg-segSystem{background:var(--dsw-static-neutral-bluish-400,#94a3b8)}
      .dsg-segTools{background:#a78bfa}
      .dsg-segMessages{background:var(--dsw-static-blue-450,#4d6bfe)}
      .dsg-segRemaining{background:var(--dsw-alias-border-l2)}
      .dsg-segPeak{background:var(--dsw-alias-state-warn-primary)}
      .dsg-segOffPeak{background:var(--dsw-alias-state-success-primary)}
      .dsg-segModel0{background:#4d6bfe}
      .dsg-segModel1{background:#a78bfa}
      .dsg-segModel2{background:#2fa24c}
      .dsg-segModel3{background:#e0a23f}
      .dsg-segModel4{background:#e06c9f}
      .dsg-statDetails{display:flex;flex-direction:column;margin:6px 0 0;padding:0}
      .dsg-statDetail{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:4px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-statDetail:last-child{border-bottom:none}
      .dsg-statDetail dt{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
      .dsg-statDetailLabel{display:inline-flex;align-items:center;gap:6px}
      .dsg-statSwatch{display:inline-block;width:8px;height:8px;flex:none;border-radius:2px}
      .dsg-statDetail dd{margin:0;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums;text-align:right}
      .dsg-contextRing{flex:none;overflow:visible}
      .dsg-contextRingTrack{fill:none;stroke:var(--dsw-alias-border-l3);stroke-width:2px}
      .dsg-contextRingFill{fill:none;stroke:var(--dsw-alias-label-tertiary);stroke-width:2px;stroke-linecap:round}
      @media(max-width:520px){.dsg-statLabel{width:46px}.dsg-statBody{padding-left:78px}.dsg-dataPanel{width:100%}}

      .dsg-dataHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:16px 18px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataHeading{min-width:0}
      .dsg-dataTitle{font-size:15px;line-height:22px;font-weight:600;overflow-wrap:anywhere}
      .dsg-dataMeta{margin-top:3px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;overflow-wrap:anywhere}
      .dsg-dataHeaderActions{display:flex;align-items:center;gap:4px;flex:none}
      .dsg-dataRefresh,.dsg-dataClose{width:26px;height:26px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:16px;line-height:26px;cursor:pointer}
      .dsg-dataRefresh:hover,.dsg-dataClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
      .dsg-dataRefresh:disabled{opacity:.5;cursor:default}
      .dsg-dataRefresh:focus-visible,.dsg-dataClose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
      .dsg-dataBody{flex:0 1 auto;min-height:0;max-height:max(120px,min(610px,calc(100vh - 198px)));padding:14px 18px 6px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2) transparent}
      .dsg-dataCards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .dsg-dataCard{padding:9px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);min-width:0}
      .dsg-dataCardLabel{color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:15px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
      .dsg-dataCardValue{margin-top:3px;color:var(--dsw-alias-label-primary);font-size:16px;line-height:22px;font-weight:600;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
      .dsg-dataHint{margin:10px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px}
      .dsg-dataSection{margin-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataSectionHeader{display:flex;align-items:center;gap:6px;width:100%;padding:9px 0 5px;border:none;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      .dsg-dataSectionHeader:hover .dsg-dataSectionTitle{color:var(--dsw-alias-label-primary)}
      .dsg-dataSectionHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-radius:4px}
      .dsg-dataSectionChevron{width:12px;flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px;text-align:center}
      .dsg-dataSectionTitle{display:flex;align-items:baseline;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:600}
      .dsg-dataSectionSub{color:var(--dsw-alias-label-tertiary);font-size:10.5px;font-weight:400}
      .dsg-dataSectionBody{padding:0 0 9px 18px}
      .dsg-dataCostHead,.dsg-dataCostRow{display:grid;grid-template-columns:1fr 62px 72px 64px;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataCostHead{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:15px}
      .dsg-dataCostLabel{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
      .dsg-dataCostTokens,.dsg-dataCostPrice,.dsg-dataCostAmount{text-align:right;color:var(--dsw-alias-label-secondary);font-size:10.5px;line-height:16px;font-variant-numeric:tabular-nums}
      .dsg-dataCostTotal{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:6px;color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;font-weight:600}
      .dsg-dataCostPeriod{margin-top:8px;padding-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataCostPeriodTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;font-weight:600;margin-bottom:3px}
      .dsg-dataToolModes{display:flex;align-items:center;gap:3px;margin:1px 0 5px;padding:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-2);width:fit-content}
      .dsg-dataToolMode{height:22px;padding:0 8px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:10.5px;line-height:22px;cursor:pointer;white-space:nowrap}
      .dsg-dataToolMode:hover{color:var(--dsw-alias-label-primary)}
      .dsg-dataToolMode.active{background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgb(0 0 0 / .08)}
      .dsg-dataToolMode:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
      .dsg-dataBreakdown{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-top:7px}
      .dsg-dataBreakdownRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataBreakdownLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
      .dsg-dataBreakdownValue{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}
      .dsg-dataTools{max-height:224px;overflow:auto;margin-top:4px;overscroll-behavior:contain;scrollbar-width:thin}
      .dsg-dataToolRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dsg-dataToolName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}
      .dsg-dataToolMuted{color:var(--dsw-alias-label-tertiary)}
      .dsg-dataToolStats{flex:none;color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:16px;font-variant-numeric:tabular-nums}
      .dsg-dataFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 18px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:16px}
      @media(max-width:520px){.dsg-dataCards,.dsg-dataBreakdown{grid-template-columns:1fr 1fr}.dsg-dataOverlay{padding:12px}.dsg-priceGrid{grid-template-columns:1fr 1fr}}
    `;

    /* ── shared small components ──────────────────────────────────── */

    function formatExactNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      return Math.round(n).toLocaleString('en-US');
    }

    function formatDurationMs(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return '—';
      const seconds = n / 1000;
      if (seconds < 60) return `${(Math.round(seconds * 10) / 10).toFixed(1)}s`;
      const whole = Math.round(seconds);
      return `${Math.floor(whole / 60)}m ${whole % 60}s`;
    }

    function formatPercent(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) return '—';
      const percent = n * 100;
      return `${percent >= 10 ? Math.round(percent) : Math.round(percent * 10) / 10}%`;
    }

    function formatBytes(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) return '—';
      if (n < 1024) return `${Math.round(n)} B`;
      const units = ['KB', 'MB', 'GB', 'TB'];
      let size = n / 1024;
      let unit = 0;
      while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
      }
      return `${size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[unit]}`;
    }

    function formatTps(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return '—';
      return `${n >= 100 ? n.toFixed(0) : n.toFixed(1)} tok/s`;
    }

    function StatBar({ parts }) {
      const visible = parts.filter((part) => Number(part.value) > 0);
      const total = visible.reduce((sum, part) => sum + Number(part.value), 0);
      if (total <= 0) return null;
      return h(
        'div',
        { className: 'dsg-statBar', 'aria-hidden': 'true' },
        visible.map((part) => h('span', {
          key: part.key,
          className: `dsg-statSegment ${part.className}`,
          style: { width: `${Number(part.value) / total * 100}%` },
        })),
      );
    }

    function StatRow({ label, value, aggregation, icon: rowIcon, open, onToggle, children }) {
      return h(
        'div',
        { className: 'dsg-statRow' },
        h(
          'button',
          {
            type: 'button',
            className: 'dsg-statHeader',
            'aria-expanded': open,
            onClick: onToggle,
          },
          h('span', { className: 'dsg-statIcon', 'aria-hidden': 'true' }, rowIcon ? h(rowIcon, { width: 14, height: 14 }) : null),
          h('span', { className: 'dsg-statLabel' }, label),
          aggregation ? h('span', { className: 'dsg-statAgg' }, aggregation) : null,
          h('span', { className: 'dsg-statValue' }, value),
          h('span', { className: 'dsg-statChevron', 'aria-hidden': 'true' }, open ? '▾' : '▸'),
        ),
        open ? h('div', { className: 'dsg-statBody' }, children) : null,
      );
    }

    function ContextRing({ rate }) {
      const radius = 5.5;
      const circumference = 2 * Math.PI * radius;
      return h(
        'svg',
        { viewBox: '0 0 14 14', width: 14, height: 14, className: 'dsg-contextRing', 'aria-hidden': 'true' },
        h('circle', { className: 'dsg-contextRingTrack', cx: 7, cy: 7, r: radius }),
        h('circle', {
          className: 'dsg-contextRingFill',
          cx: 7,
          cy: 7,
          r: radius,
          strokeDasharray: `${circumference * Math.max(0, Math.min(1, rate))} ${circumference}`,
          transform: 'rotate(-90 7 7)',
        }),
      );
    }

    function DataPanel(props) {
      const {
        kind,
        title,
        sessionIds,
        pricing,
        useSessions,
        tr,
        onClose,
      } = props;
      const list = typeof useSessions === 'function'
        ? useSessions((state) => state)
        : { ids: [], byId: {}, projectionsBySession: {} };
      const [live, setLive] = React.useState({});
      const [hostStatus, setHostStatus] = React.useState('loading');
      const [loading, setLoading] = React.useState(true);
      const [revision, setRevision] = React.useState(0);
      const [expanded, setExpanded] = React.useState({
        activity: false,
        usage: false,
        context: false,
        cost: false,
        models: false,
        storage: false,
        tools: false,
      });
      const [toolsMode, setToolsMode] = React.useState('available');
      const overlayRef = React.useRef(null);
      React.useEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay) return undefined;
        const onWheel = (event) => {
          const target = event.target;
          if (target && typeof target.closest === 'function' && target.closest('.dsg-dataBody')) {
            event.stopPropagation();
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        };
        overlay.addEventListener('wheel', onWheel, { passive: false });
        return () => overlay.removeEventListener('wheel', onWheel);
      }, []);
      const idsKey = sessionIds.join('|');
      const holidayKey = (pricing?.holidays ?? []).join(',');

      React.useEffect(() => {
        let active = true;
        setLoading(true);
        setHostStatus('loading');
        fetchLiveSessionData(sessionIds, revision > 0, pricing?.holidays ?? []).then(({ rows, bridge, failed }) => {
          if (!active) return;
          setLive(Object.fromEntries(rows));
          setHostStatus(!bridge ? 'unavailable' : failed ? 'partial' : 'ok');
        }).catch(() => {
          if (active) setHostStatus('error');
        }).finally(() => {
          if (active) setLoading(false);
        });
        return () => {
          active = false;
        };
      }, [idsKey, holidayKey, revision]);

      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [onClose]);

      const rows = React.useMemo(() => sessionIds.map((sessionId) => {
        const host = live[sessionId];
        const rawUsage = projectionOf(list, sessionId, 'tokenUsage');
        const hostUsage = host?.tokenUsage;
        const rawPressure = projectionOf(list, sessionId, 'contextPressure');
        const rawStats = projectionOf(list, sessionId, 'sessionStats');
        const rawBreakdown = projectionOf(list, sessionId, 'contextBreakdown');
        const usage = usageSummary(rawUsage ?? hostUsage);
        const pressure = rawPressure ?? host?.contextPressure;
        const stats = rawStats ?? host?.stats;
        const breakdown = rawBreakdown ?? host?.contextBreakdown;
        const hasUsage = rawUsage !== undefined && rawUsage !== null || hostUsage !== undefined && hostUsage !== null;
        const hasPressure = rawPressure !== undefined && rawPressure !== null || host?.contextPressure !== undefined;
        const hasStats = rawStats !== undefined && rawStats !== null || host?.stats !== undefined;
        const hasBreakdown = rawBreakdown !== undefined && rawBreakdown !== null || host?.contextBreakdown !== undefined;
        const loggedSelection = projectionOf(list, sessionId, 'modelSelection');
        const selectedModel = host?.model ?? loggedSelection?.next?.model ?? loggedSelection?.lastUsed?.model;
        const selectedProvider = host?.provider ?? loggedSelection?.next?.provider ?? loggedSelection?.lastUsed?.provider;
        const hasModelTime = Array.isArray(host?.modelUsage)
          && host.modelUsage.some((entry) => Number(entry?.durationMs) > 0);
        const modelUsage = Array.isArray(host?.modelUsage) && host.modelUsage.length > 0
          ? host.modelUsage
          : selectedModel
            ? [{ provider: selectedProvider ?? '', model: selectedModel, durationMs: 0 }]
            : [];
        const fallbackPeriod = deepSeekPeakAt(Date.now(), pricing?.holidays) ? 'peak' : 'offPeak';
        const noUsage = usageSummary({});
        const periods = host?.usageByPeriod
          ? {
              peak: periodUsage(host.usageByPeriod.peak),
              offPeak: periodUsage(host.usageByPeriod.offPeak),
            }
          : fallbackPeriod === 'peak'
            ? { peak: usage, offPeak: noUsage }
            : { peak: noUsage, offPeak: usage };
        const periodTotal = periods.peak.total + periods.offPeak.total;
        const hasPeriodCoverage = usage.total === 0 || periodTotal > 0;
        return {
          id: sessionId,
          usage,
          pressure,
          context: contextRateOf(pressure),
          stats,
          breakdown,
          periods,
          hasUsage,
          hasPressure,
          hasStats,
          hasBreakdown,
          hasModelTime,
          estimatedPeriod: !host?.usageByPeriod && hasUsage,
          hasPeriodCoverage,
          model: selectedModel,
          provider: selectedProvider,
          modelUsage,
          toolSource: host?.toolSource,
          tools: host?.tools ?? [],
          hasFileSize: Number.isFinite(Number(host?.fileBytes)),
          fileBytes: Number.isFinite(Number(host?.fileBytes)) ? Number(host.fileBytes) : 0,
          eventCount: Number.isFinite(Number(host?.eventCount)) ? Number(host.eventCount) : 0,
          hasEventCount: Number.isFinite(Number(host?.eventCount)),
          cost: hasUsage && hasPeriodCoverage ? costOfPeriods(periods, pricing) : null,
        };
      }), [list, live, idsKey, holidayKey, pricing]);

      const totals = rows.reduce((acc, row) => ({
        input: acc.input + row.usage.input,
        cacheRead: acc.cacheRead + row.usage.cacheRead,
        cacheWrite: acc.cacheWrite + row.usage.cacheWrite,
        output: acc.output + row.usage.output,
        reasoning: acc.reasoning + row.usage.reasoning,
        total: acc.total + row.usage.total,
      }), { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, total: 0 });
      const cacheBase = totals.input + totals.cacheRead + totals.cacheWrite;
      const cacheRate = cacheBase > 0 ? totals.cacheRead / cacheBase : 0;
      const costs = rows.map((row) => row.cost);
      const knownCosts = costs.filter((value) => value !== null);
      const costPartial = knownCosts.length > 0 && knownCosts.length < costs.length;
      const totalCost = knownCosts.length > 0
        ? knownCosts.reduce((sum, value) => sum + value, 0)
        : null;
      const hostUnavailable = hostStatus === 'unavailable';
      const activeRows = rows.filter((row) => {
        const host = live[row.id];
        return Boolean(host) && host.live === true && !host.error;
      });
      const errorRows = rows.filter((row) => {
        const host = live[row.id];
        return Boolean(host?.error) || (hostStatus === 'error' && !host);
      });
      const nonActiveRows = hostUnavailable || hostStatus === 'loading'
        ? []
        : rows.filter((row) => {
            const host = live[row.id];
            return !host || (host.live === false && !host.error);
          });
      const toolRows = activeRows;
      const toolSnapshot = toolRows.some((row) => row.toolSource === 'snapshot');
      const toolMap = new Map();
      for (const row of toolRows) mergeTools(toolMap, row.tools);
      const tools = [...toolMap.values()].sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));
      const availableTools = tools.filter((tool) => tool.available).length;
      const closedTools = tools.length - availableTools;
      const visibleTools = tools.filter((tool) => (toolsMode === 'available' ? tool.available : !tool.available));
      const totalCalls = tools.reduce((sum, tool) => sum + tool.calls, 0);
      const isSession = kind === 'session';
      const showToolSection = isSession && (hostStatus === 'loading' || toolRows.length > 0);
      const toolHideNotice = !showToolSection
        ? hostUnavailable ? tr('data.toolHostUnavailable')
          : errorRows.length > 0 ? tr('data.toolReadError')
            : nonActiveRows.length > 0 ? tr('data.toolNonActive')
              : null
        : null;
      const toolExtraNotes = showToolSection
        ? [
            nonActiveRows.length > 0
              ? h('div', { className: 'dsg-dataHint' }, tr('data.toolSkippedNonActive', { count: nonActiveRows.length }))
              : null,
            errorRows.length > 0
              ? h('div', { className: 'dsg-dataHint' }, tr('data.toolPartialError', { count: errorRows.length }))
              : null,
          ].filter(Boolean)
        : [];
      const stats = rows.reduce((acc, row) => {
        const value = row.stats ?? {};
        return {
          turns: acc.turns + (Number(value.turns) || 0),
          steps: acc.steps + (Number(value.steps) || 0),
          llmMs: acc.llmMs + (Number(value.llmMs) || 0),
          toolMs: acc.toolMs + (Number(value.toolMs) || 0),
          ttftMs: acc.ttftMs + (Number(value.ttftMs) || 0),
          ttftSteps: acc.ttftSteps + (Number(value.ttftSteps) || 0),
          decodeMs: acc.decodeMs + (Number(value.decodeMs) || 0),
          decodeTokens: acc.decodeTokens + (Number(value.decodeTokens) || 0),
        };
      }, { turns: 0, steps: 0, llmMs: 0, toolMs: 0, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 });
      const anyStats = rows.some((row) => row.hasStats);
      const hasStats = rows.some((row) => row.stats && (row.stats.turns || row.stats.steps || row.stats.llmMs));
      const anyUsage = rows.some((row) => row.hasUsage);
      const periodPartial = rows.some((row) => row.hasUsage && row.hasPeriodCoverage === false);
      const usagePartial = anyUsage && !rows.every((row) => row.hasUsage);
      const anyBreakdown = rows.some((row) => row.hasBreakdown);
      const breakdownPartial = anyBreakdown && !rows.every((row) => row.hasBreakdown);
      const statsPartial = anyStats && !rows.every((row) => row.hasStats);
      const anyModelTime = rows.some((row) => row.hasModelTime);
      const modelTimePartial = anyModelTime && !rows.every((row) => row.hasModelTime);
      const speed = isSession && stats.decodeMs > 0 ? formatTps(stats.decodeTokens / (stats.decodeMs / 1000)) : null;
      const breakdownRows = rows.filter((row) => row.hasBreakdown);
      const breakdownCount = breakdownRows.length;
      const breakdownSum = breakdownRows.reduce((acc, row) => ({
        systemTokens: acc.systemTokens + (Number(row.breakdown?.systemTokens) || 0),
        toolsTokens: acc.toolsTokens + (Number(row.breakdown?.toolsTokens) || 0),
        messageTokens: acc.messageTokens + (Number(row.breakdown?.messageTokens) || 0),
      }), { systemTokens: 0, toolsTokens: 0, messageTokens: 0 });
      const breakdown = isSession
        ? breakdownSum
        : {
            systemTokens: breakdownCount > 0 ? breakdownSum.systemTokens / breakdownCount : 0,
            toolsTokens: breakdownCount > 0 ? breakdownSum.toolsTokens / breakdownCount : 0,
            messageTokens: breakdownCount > 0 ? breakdownSum.messageTokens / breakdownCount : 0,
          };
      const breakdownTotal = breakdown.systemTokens + breakdown.toolsTokens + breakdown.messageTokens;
      const sessionContext = isSession ? rows[0]?.context ?? null : null;
      const percent = sessionContext === null ? null : Math.min(100, Math.round(sessionContext.rate * 100));
      const remainingContext = sessionContext === null ? 0 : Math.max(0, sessionContext.window - breakdownTotal);
      const totalPeriods = rows.reduce((acc, row) => ({
        peak: {
          input: acc.peak.input + row.periods.peak.input,
          cacheRead: acc.peak.cacheRead + row.periods.peak.cacheRead,
          cacheWrite: acc.peak.cacheWrite + row.periods.peak.cacheWrite,
          output: acc.peak.output + row.periods.peak.output,
          total: acc.peak.total + row.periods.peak.total,
        },
        offPeak: {
          input: acc.offPeak.input + row.periods.offPeak.input,
          cacheRead: acc.offPeak.cacheRead + row.periods.offPeak.cacheRead,
          cacheWrite: acc.offPeak.cacheWrite + row.periods.offPeak.cacheWrite,
          output: acc.offPeak.output + row.periods.offPeak.output,
          total: acc.offPeak.total + row.periods.offPeak.total,
        },
      }), {
        peak: { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, total: 0 },
        offPeak: { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, total: 0 },
      });
      const costPeriods = [
        { key: 'peak', label: tr('data.peak'), usage: totalPeriods.peak, rates: pricing?.peak },
        { key: 'offPeak', label: tr('data.offPeak'), usage: totalPeriods.offPeak, rates: pricing?.offPeak },
      ].map((period) => ({
        ...period,
        cost: costOfUsage(period.usage, period.rates),
      })).filter((period) => period.usage.total > 0);
      const periodParts = [
        { key: 'input', label: tr('data.input'), field: 'input' },
        { key: 'cacheRead', label: tr('data.cacheRead'), field: 'cacheRead' },
        { key: 'cacheWrite', label: tr('data.cacheWrite'), field: 'cacheWrite' },
        { key: 'output', label: tr('data.output'), field: 'output' },
      ];
      const estimatedPeriod = rows.some((row) => row.estimatedPeriod);
      const modelMap = new Map();
      for (const row of rows) {
        for (const entry of row.modelUsage) {
          if (!entry || typeof entry.provider !== 'string' || typeof entry.model !== 'string') continue;
          const key = `${entry.provider}\u0000${entry.model}`;
          const current = modelMap.get(key) ?? {
            provider: entry.provider,
            model: entry.model,
            durationMs: 0,
          };
          current.durationMs += Math.max(0, Number(entry.durationMs) || 0);
          modelMap.set(key, current);
        }
      }
      const modelRows = [...modelMap.values()]
        .sort((a, b) => b.durationMs - a.durationMs || a.model.localeCompare(b.model));
      const modelTotalMs = modelRows.reduce((sum, entry) => sum + entry.durationMs, 0);
      for (const entry of modelRows) {
        entry.share = modelTotalMs > 0
          ? entry.durationMs / modelTotalMs
          : 1 / modelRows.length;
      }
      const modelValue = modelRows.length === 0
        ? '—'
        : !anyModelTime
          ? modelRows.length === 1
            ? `${modelRows[0].model} · ${tr('data.noTimeShort')}`
            : `${modelRows.length} ${tr('data.models')} · ${tr('data.noTimeShort')}`
          : modelRows.length === 1
            ? `${modelRows[0].model} · 100%`
            : `${modelRows.length} ${tr('data.models')} · ${formatDurationMs(modelTotalMs)}`;

      const fileSizeRows = rows.filter((row) => row.hasFileSize);
      const anyFileSize = fileSizeRows.length > 0;
      const fileSizePartial = anyFileSize && fileSizeRows.length < rows.length;
      const totalFileBytes = fileSizeRows.reduce((sum, row) => sum + row.fileBytes, 0);
      const eventCountRows = rows.filter((row) => row.hasEventCount);
      const anyEventCount = eventCountRows.length > 0;
      const totalEventCount = eventCountRows.reduce((sum, row) => sum + row.eventCount, 0);
      const eventCountPartial = anyEventCount && eventCountRows.length < rows.length;
      const fileValue = anyFileSize ? formatBytes(totalFileBytes) : '—';

      const dataIncomplete = !anyUsage
        || periodPartial
        || costPartial
        || !anyFileSize
        || usagePartial
        || !anyStats
        || statsPartial
        || !anyBreakdown
        || breakdownPartial
        || (modelRows.length > 0 && !anyModelTime)
        || modelTimePartial
        || estimatedPeriod
        || totalCost === null
        || !pricingConfigured(pricing);

      const modelCounts = new Map();
      for (const row of rows) {
        if (row.model) modelCounts.set(row.model, (modelCounts.get(row.model) ?? 0) + 1);
      }
      const models = [...modelCounts.entries()].map(([model, count]) => `${model} × ${count}`);
      const running = sessionIds.filter((id) => list.byId?.[id]?.running === true).length;
      const modelText = isSession
        ? (rows[0]?.provider ? `${rows[0].provider} / ${rows[0]?.model ?? '—'}` : rows[0]?.model ?? '—')
        : models.join(', ') || '—';
      const metaText = isSession
        ? `${modelText}${hasStats ? ` · ${tr('data.turns')} ${stats.turns}` : ''}`
        : `${rows.length} ${tr('data.sessions')} · ${running} ${tr('status.running')}`;
      const swatched = (label, className) => h(
        'span',
        { className: 'dsg-statDetailLabel' },
        h('span', { className: `dsg-statSwatch ${className}`, 'aria-hidden': 'true' }),
        label,
      );
      const detailList = (entries) => h(
        'dl',
        { className: 'dsg-statDetails' },
        entries.map(([label, value]) => h(
          'div',
          { key: label, className: 'dsg-statDetail' },
          h('dt', {}, label),
          h('dd', {}, value),
        )),
      );
      const toggle = (key) => setExpanded((previous) => ({ ...previous, [key]: !previous[key] }));
      const activityValue = !anyStats
        ? '—'
        : hasStats
          ? `${stats.turns} ${tr('data.turns')} · ${stats.steps} ${tr('data.steps')}${speed ? ` · ${speed}` : ''}`
          : '—';
      const usageValue = anyUsage
        ? `${formatCompactNumber(totals.total)}${cacheBase > 0 ? ` · ${(cacheRate * 100).toFixed(1)}%` : ''}`
        : '—';
      const contextValue = sessionContext !== null
        ? h(
            React.Fragment,
            null,
            h(ContextRing, { rate: sessionContext.rate }),
            ` ~${percent}% · ~${formatCompactNumber(sessionContext.used)} / ${formatCompactNumber(sessionContext.window)}`,
          )
        : breakdownTotal > 0 ? `~${formatCompactNumber(breakdownTotal)}` : '—';
      const toolsValue = `${availableTools} ${tr('data.toolsAvailable')} · ${closedTools} ${tr('data.toolsClosed')} · ${totalCalls} ${tr('data.toolCalls')}`;

      return h(
        'div',
        {
          className: 'dsg-dataOverlay',
          ref: overlayRef,
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'section',
          {
            className: 'dsg-dataPanel',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
          },
          h(
            'header',
            { className: 'dsg-dataHeader' },
            h(
              'div',
              { className: 'dsg-dataHeading' },
              h('div', { className: 'dsg-dataTitle' }, title),
              h('div', { className: 'dsg-dataMeta' }, metaText),
            ),
            h(
              'div',
              { className: 'dsg-dataHeaderActions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsg-dataRefresh',
                  title: tr('data.refresh'),
                  'aria-label': tr('data.refresh'),
                  disabled: loading,
                  onClick: () => setRevision((value) => value + 1),
                },
                loading ? '…' : '↻',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsg-dataClose',
                  title: tr('data.close'),
                  'aria-label': tr('data.close'),
                  onClick: onClose,
                },
                '×',
              ),
            ),
          ),
          h(
            'div',
            {
              className: 'dsg-dataBody',
            },
            !isSession
              ? h('div', { className: 'dsg-dataHint' }, tr('data.aggregationHint'))
              : null,
            dataIncomplete
              ? h('div', { className: 'dsg-dataHint' }, tr('data.incompleteHint'))
              : null,
            h(
              'div',
              { className: 'dsg-statList' },
              h(
                StatRow,
                {
                  label: tr('data.activity'),
                  aggregation: isSession ? undefined : tr('data.aggSum'),
                  icon: IconGauge,
                  value: activityValue,
                  open: expanded.activity,
                  onToggle: () => toggle('activity'),
                },
                detailList(isSession
                  ? [
                      [tr('data.turns'), hasStats ? formatExactNumber(stats.turns) : '—'],
                      [tr('data.steps'), hasStats ? formatExactNumber(stats.steps) : '—'],
                      [tr('data.llmTime'), formatDurationMs(stats.llmMs)],
                      [tr('data.toolTime'), formatDurationMs(stats.toolMs)],
                      [tr('data.ttft'), stats.ttftSteps > 0 ? formatDurationMs(stats.ttftMs / stats.ttftSteps) : '—'],
                      [tr('data.speed'), speed ?? '—'],
                    ]
                  : [
                      [tr('data.turns'), hasStats ? formatExactNumber(stats.turns) : '—'],
                      [tr('data.steps'), hasStats ? formatExactNumber(stats.steps) : '—'],
                      [tr('data.llmTime'), formatDurationMs(stats.llmMs)],
                      [tr('data.toolTime'), formatDurationMs(stats.toolMs)],
                    ]),
                !anyStats
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.noStatsData'))
                  : statsPartial
                    ? h('div', { className: 'dsg-dataHint' }, tr('data.partialStats'))
                    : null,
              ),
              h(
                StatRow,
                {
                  label: tr('data.usage'),
                  aggregation: isSession ? undefined : tr('data.aggSum'),
                  icon: IconDatabase,
                  value: usageValue,
                  open: expanded.usage,
                  onToggle: () => toggle('usage'),
                },
                h(StatBar, {
                  parts: [
                    { key: 'input', value: totals.input, className: 'dsg-segInput' },
                    { key: 'cacheRead', value: totals.cacheRead, className: 'dsg-segCacheRead' },
                    { key: 'cacheWrite', value: totals.cacheWrite, className: 'dsg-segCacheWrite' },
                    { key: 'output', value: totals.output, className: 'dsg-segOutput' },
                  ],
                }),
                detailList([
                  [tr('data.cacheHit'), anyUsage && cacheBase > 0 ? `${(cacheRate * 100).toFixed(1)}%` : '—'],
                  [swatched(tr('data.input'), 'dsg-segInput'), anyUsage ? formatExactNumber(totals.input) : '—'],
                  [swatched(tr('data.cacheRead'), 'dsg-segCacheRead'), anyUsage ? formatExactNumber(totals.cacheRead) : '—'],
                  [swatched(tr('data.cacheWrite'), 'dsg-segCacheWrite'), anyUsage ? formatExactNumber(totals.cacheWrite) : '—'],
                  [swatched(tr('data.output'), 'dsg-segOutput'), anyUsage ? formatExactNumber(totals.output) : '—'],
                  ...(anyUsage && totals.reasoning > 0 ? [[tr('data.reasoning'), formatExactNumber(totals.reasoning)]] : []),
                ]),
                !anyUsage
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.noUsageData'))
                  : usagePartial
                    ? h('div', { className: 'dsg-dataHint' }, tr('data.partialUsage'))
                    : null,
              ),
              h(
                StatRow,
                {
                  label: tr('data.context'),
                  aggregation: isSession ? undefined : tr('data.aggAverage'),
                  icon: IconContext,
                  value: contextValue,
                  open: expanded.context,
                  onToggle: () => toggle('context'),
                },
                breakdownTotal > 0
                  ? isSession
                    ? h(
                        React.Fragment,
                        null,
                        h(StatBar, {
                          parts: [
                            { key: 'system', value: breakdown.systemTokens, className: 'dsg-segSystem' },
                            { key: 'tools', value: breakdown.toolsTokens, className: 'dsg-segTools' },
                            { key: 'messages', value: breakdown.messageTokens, className: 'dsg-segMessages' },
                            { key: 'remaining', value: remainingContext, className: 'dsg-segRemaining' },
                          ],
                        }),
                        detailList([
                          [swatched(tr('data.system'), 'dsg-segSystem'), `~${formatCompactNumber(breakdown.systemTokens)}`],
                          [swatched(tr('data.tools'), 'dsg-segTools'), `~${formatCompactNumber(breakdown.toolsTokens)}`],
                          [swatched(tr('data.messages'), 'dsg-segMessages'), `~${formatCompactNumber(breakdown.messageTokens)}`],
                          [swatched(tr('data.remaining'), 'dsg-segRemaining'), `~${formatCompactNumber(remainingContext)}`],
                        ]),
                      )
                    : detailList([
                        [swatched(tr('data.system'), 'dsg-segSystem'), `~${formatCompactNumber(breakdown.systemTokens)}`],
                        [swatched(tr('data.tools'), 'dsg-segTools'), `~${formatCompactNumber(breakdown.toolsTokens)}`],
                        [swatched(tr('data.messages'), 'dsg-segMessages'), `~${formatCompactNumber(breakdown.messageTokens)}`],
                      ])
                  : h('div', { className: 'dsg-dataHint' }, tr('data.noBreakdown')),
                breakdownPartial
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.partialBreakdown'))
                  : null,
              ),
              modelRows.length > 0 ? h(
                StatRow,
                {
                  label: tr('data.models'),
                  aggregation: isSession ? undefined : tr('data.aggSum'),
                  icon: IconModel,
                  value: modelValue,
                  open: expanded.models,
                  onToggle: () => toggle('models'),
                },
                anyModelTime
                  ? h(StatBar, {
                      parts: modelRows.map((entry, index) => ({
                        key: `${entry.provider}/${entry.model}`,
                        value: entry.durationMs,
                        className: `dsg-segModel${index % 5}`,
                      })),
                    })
                  : null,
                h('div', { className: 'dsg-dataHint' }, tr('data.modelTimeHint')),
                detailList(modelRows.map((entry, index) => [
                  swatched(`${entry.model}`, `dsg-segModel${index % 5}`),
                  anyModelTime
                    ? `${formatPercent(entry.share)} · ${formatDurationMs(entry.durationMs)}`
                    : '—',
                ])),
                !anyModelTime
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.modelTimeUnavailable'))
                  : modelTimePartial
                    ? h('div', { className: 'dsg-dataHint' }, tr('data.modelTimePartial'))
                    : null,
              ) : null,
              h(
                StatRow,
                {
                  label: tr('data.fileSize'),
                  aggregation: isSession ? undefined : tr('data.aggSum'),
                  icon: IconStorage,
                  value: fileValue,
                  open: expanded.storage,
                  onToggle: () => toggle('storage'),
                },
                detailList([
                  [tr('data.fileSize'), anyFileSize ? formatBytes(totalFileBytes) : '—'],
                  [tr('data.fileEvents'), anyEventCount ? formatExactNumber(totalEventCount) : '—'],
                  ...(fileSizePartial ? [[tr('data.fileSessions'), `${fileSizeRows.length} / ${rows.length}`]] : []),
                ]),
                h('div', { className: 'dsg-dataHint' }, anyFileSize
                  ? tr('data.fileSizeHint')
                  : tr('data.fileSizeUnavailable')),
                fileSizePartial
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.fileSizePartial'))
                  : null,
                eventCountPartial
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.fileEventPartial'))
                  : null,
              ),
              h(
                StatRow,
                {
                  label: tr('data.cost'),
                  aggregation: isSession ? undefined : tr('data.aggSum'),
                  icon: IconCoin,
                  value: pricingConfigured(pricing) && knownCosts.length > 0 ? formatCost(totalCost) : '—',
                  open: expanded.cost,
                  onToggle: () => toggle('cost'),
                },
                !pricingConfigured(pricing)
                  ? h('div', { className: 'dsg-dataHint' }, `${tr('data.noPrice')} · ${tr('data.priceHint')}`)
                  : !anyUsage
                    ? h('div', { className: 'dsg-dataHint' }, tr('data.noCostUsage'))
                    : h(
                      React.Fragment,
                      null,
                      h(StatBar, {
                        parts: costPeriods.map((period) => ({
                          key: period.key,
                          value: period.cost ?? 0,
                          className: period.key === 'peak' ? 'dsg-segPeak' : 'dsg-segOffPeak',
                        })),
                      }),
                      h('div', { className: 'dsg-dataHint' }, `${tr('data.perMillion')} · ${tr('data.peakSchedule')}`),
                      ...costPeriods
                        .filter((period) => period.usage.total > 0)
                        .map((period) => h(
                          'div',
                          { key: period.key, className: 'dsg-dataCostPeriod' },
                          h(
                            'div',
                            { className: 'dsg-dataCostPeriodTitle' },
                            h('span', {}, period.label),
                            h('span', {}, formatCost(period.cost)),
                          ),
                          h('div', { className: 'dsg-dataCostHead' },
                            h('span', {}, tr('data.item')),
                            h('span', {}, tr('data.tokens')),
                            h('span', {}, tr('data.price')),
                            h('span', {}, tr('data.amount'))),
                          ...periodParts.map((part) => h(
                            'div',
                            { key: part.key, className: 'dsg-dataCostRow' },
                            h('span', { className: 'dsg-dataCostLabel' }, h('span', { className: `dsg-statSwatch dsg-seg${part.key.charAt(0).toUpperCase()}${part.key.slice(1)}`, 'aria-hidden': 'true' }), part.label),
                            h('span', { className: 'dsg-dataCostTokens' }, formatCompactNumber(period.usage[part.field])),
                            h('span', { className: 'dsg-dataCostPrice' }, Number.isFinite(Number(period.rates?.[part.field])) ? `¥${Number(period.rates[part.field]).toFixed(4)}` : '—'),
                            h('span', { className: 'dsg-dataCostAmount' }, formatCost(
                              Number.isFinite(Number(period.rates?.[part.field]))
                                ? period.usage[part.field] / 1e6 * Number(period.rates[part.field])
                                : null,
                            )),
                          )),
                        )),
                      h('div', { className: 'dsg-dataCostTotal' },
                        h('span', {}, tr('data.cost')),
                        h('span', {}, formatCost(totalCost))),
                      estimatedPeriod
                        ? h('div', { className: 'dsg-dataHint' }, tr('data.estimatedPeriod'))
                        : null,
                      totalCost === null && pricingConfigured(pricing)
                        ? h('div', { className: 'dsg-dataHint' }, tr('data.missingPeriodPrice'))
                        : null,
                      periodPartial
                        ? h('div', { className: 'dsg-dataHint' }, tr('data.noPeriodData'))
                        : null,
                      costPartial
                        ? h('div', { className: 'dsg-dataHint' }, tr('data.costPartial'))
                        : null,
                    ),
              ),
              showToolSection ? h(
                StatRow,
                {
                  label: tr('data.tools'),
                  icon: IconWrench,
                  value: toolsValue,
                  open: expanded.tools,
                  onToggle: () => toggle('tools'),
                },
                h(
                  'div',
                  { className: 'dsg-dataToolModes', role: 'group', 'aria-label': tr('data.tools') },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsg-dataToolMode' + (toolsMode === 'available' ? ' active' : ''),
                      'aria-pressed': toolsMode === 'available',
                      onClick: () => setToolsMode('available'),
                    },
                    `${tr('data.toolsAvailable')} (${availableTools})`,
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsg-dataToolMode' + (toolsMode === 'unavailable' ? ' active' : ''),
                      'aria-pressed': toolsMode === 'unavailable',
                      onClick: () => setToolsMode('unavailable'),
                    },
                    `${tr('data.toolsClosed')} (${closedTools})`,
                  ),
                ),
                visibleTools.length > 0
                  ? h(
                      'div',
                      { className: 'dsg-dataTools' },
                      visibleTools.map((tool) => h(
                        'div',
                        { key: tool.name, className: 'dsg-dataToolRow' },
                        h(
                          'span',
                          { className: 'dsg-dataToolName' },
                          tool.available ? null : h('span', { className: 'dsg-dataToolMuted' }, '· '),
                          tool.name,
                        ),
                        h(
                          'span',
                          { className: 'dsg-dataToolStats' },
                          `${tool.calls} ${tr('data.toolCalls')}`,
                          tool.errors > 0 ? ` · ${tool.errors} ${tr('data.toolErrors')}` : '',
                        ),
                      )),
                    )
                  : h('div', { className: 'dsg-dataHint' }, loading
                      ? tr('data.loading')
                      : tools.length === 0 ? tr('data.toolNoVisible')
                        : toolsMode === 'available' ? tr('data.noAvailableTools') : tr('data.noClosedTools')),
                h('div', { className: 'dsg-dataHint' }, tr('data.toolsScope')),
                toolSnapshot
                  ? h('div', { className: 'dsg-dataHint' }, tr('data.toolSnapshot'))
                  : null,
                ...toolExtraNotes,
              ) : null,
              isSession && !showToolSection && toolHideNotice
                ? h('div', { className: 'dsg-dataHint' }, toolHideNotice)
                : null,
            ),
          ),
          h(
            'footer',
            { className: 'dsg-dataFooter' },
            h('span', {}, tr('data.note')),
            loading ? h('span', {}, tr('data.loading')) : null,
          ),
        ),
      );
    }

    function DataSettings(props) {
      const tr = typeof props.t === 'function' ? props.t : translate;
      const [priceMode, setPriceMode] = React.useState('peak');
      const [holidayText, setHolidayText] = React.useState(() => (loadPrefs().pricing?.holidays ?? []).join(', '));
      const makePriceValues = (pricing) => {
        const source = pricing ?? {};
        const valuesFor = (rates) => ({
          input: rates?.input === undefined ? '' : String(rates.input),
          cacheRead: rates?.cacheRead === undefined ? '' : String(rates.cacheRead),
          cacheWrite: rates?.cacheWrite === undefined ? '' : String(rates.cacheWrite),
          output: rates?.output === undefined ? '' : String(rates.output),
        });
        return { peak: valuesFor(source.peak), offPeak: valuesFor(source.offPeak) };
      };
      const [priceValues, setPriceValues] = React.useState(() => makePriceValues(loadPrefs().pricing));

      React.useEffect(() => {
        const sync = () => {
          const prefs = loadPrefs();
          setHolidayText((prefs.pricing?.holidays ?? []).join(', '));
          setPriceValues(makePriceValues(prefs.pricing));
        };
        window.addEventListener(BRIDGE_EVENT, sync);
        return () => window.removeEventListener(BRIDGE_EVENT, sync);
      }, []);

      const updatePrice = (key, raw) => {
        setPriceValues((previous) => ({
          ...previous,
          [priceMode]: { ...previous[priceMode], [key]: raw },
        }));
      };

      const writePricing = (pricing) => {
        const prefs = loadPrefs();
        savePrefs({ ...prefs, pricing });
        try { window.dispatchEvent(new Event(BRIDGE_EVENT)); } catch { /* next open reads it */ }
      };

      const commitPrice = (key) => {
        const trimmed = String(priceValues[priceMode]?.[key] ?? '').trim();
        const numeric = trimmed === '' ? undefined : Number(trimmed);
        if (numeric !== undefined && (!Number.isFinite(numeric) || numeric < 0)) return;
        const prefs = loadPrefs();
        const pricing = {
          peak: { ...(prefs.pricing?.peak ?? {}) },
          offPeak: { ...(prefs.pricing?.offPeak ?? {}) },
          currency: 'CNY',
          touched: true,
          ...(Array.isArray(prefs.pricing?.holidays) && prefs.pricing.holidays.length > 0 ? { holidays: prefs.pricing.holidays } : {}),
        };
        if (numeric === undefined) delete pricing[priceMode][key];
        else pricing[priceMode][key] = numeric;
        writePricing(pricing);
      };

      const savePrices = () => {
        const pricing = { peak: {}, offPeak: {}, currency: 'CNY', touched: true };
        for (const mode of ['peak', 'offPeak']) {
          for (const key of ['input', 'cacheRead', 'cacheWrite', 'output']) {
            const trimmed = String(priceValues[mode]?.[key] ?? '').trim();
            if (trimmed === '') continue;
            const numeric = Number(trimmed);
            if (!Number.isFinite(numeric) || numeric < 0) return;
            pricing[mode][key] = numeric;
          }
        }
        const prefs = loadPrefs();
        if (Array.isArray(prefs.pricing?.holidays) && prefs.pricing.holidays.length > 0) pricing.holidays = prefs.pricing.holidays;
        writePricing(pricing);
      };

      const commitHolidays = () => {
        const days = [...new Set(
          String(holidayText)
            .split(/[,，\s]+/)
            .map((day) => day.trim())
            .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)),
        )].sort();
        const prefs = loadPrefs();
        const pricing = {
          peak: { ...(prefs.pricing?.peak ?? {}) },
          offPeak: { ...(prefs.pricing?.offPeak ?? {}) },
          currency: 'CNY',
          touched: true,
        };
        if (days.length > 0) pricing.holidays = days;
        writePricing(pricing);
        setHolidayText(days.join(', '));
      };

      return h(
        'div',
        { className: 'dsg-settingsPage' },
        h('h2', { className: 'dsg-settingsTitle' }, tr('settings.title')),
        h('p', { className: 'dsg-settingsIntro' }, tr('settings.intro')),
        h(
          'div',
          { className: 'dsg-settingsRow' },
          h(
            'div',
            { className: 'dsg-settingsMain' },
            h('div', { className: 'dsg-settingsLabelRow' }, h('span', { className: 'dsg-settingsLabel' }, tr('settings.pricing'))),
            h('div', { className: 'dsg-settingsHint' }, tr('settings.pricingHint')),
            h(
              'div',
              { className: 'dsg-priceModes', role: 'group', 'aria-label': tr('settings.pricing') },
              h('button', {
                type: 'button',
                className: 'dsg-priceMode' + (priceMode === 'peak' ? ' active' : ''),
                'aria-pressed': priceMode === 'peak',
                onClick: () => setPriceMode('peak'),
              }, tr('settings.peak')),
              h('button', {
                type: 'button',
                className: 'dsg-priceMode' + (priceMode === 'offPeak' ? ' active' : ''),
                'aria-pressed': priceMode === 'offPeak',
                onClick: () => setPriceMode('offPeak'),
              }, tr('settings.offPeak')),
            ),
            h(
              'div',
              { className: 'dsg-priceGrid' },
              [
                ['input', tr('settings.priceInput')],
                ['cacheRead', tr('settings.priceCacheRead')],
                ['cacheWrite', tr('settings.priceCacheWrite')],
                ['output', tr('settings.priceOutput')],
              ].map(([key, fieldLabel]) => h(
                'label',
                { key, className: 'dsg-priceField' },
                h('span', {}, fieldLabel),
                h('input', {
                  className: 'dsg-priceInput',
                  type: 'number',
                  min: '0',
                  step: '0.001',
                  inputMode: 'decimal',
                  value: priceValues[priceMode]?.[key] ?? '',
                  placeholder: '0.00',
                  onChange: (event) => updatePrice(key, event.target.value),
                  onBlur: () => commitPrice(key),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  },
                }),
              )),
            ),
            h('button', { type: 'button', className: 'dsg-priceSave', onClick: savePrices }, tr('settings.savePrices')),
            h(
              'label',
              { className: 'dsg-holidayField' },
              h('span', {}, tr('settings.holidays')),
              h('input', {
                className: 'dsg-priceInput',
                type: 'text',
                value: holidayText,
                placeholder: tr('settings.holidaysPlaceholder'),
                onChange: (event) => setHolidayText(event.target.value),
                onBlur: commitHolidays,
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                },
              }),
            ),
            h('div', { className: 'dsg-settingsHint' }, tr('settings.holidaysHint')),
          ),
        ),
      );
    }

    /* ── data plugin body ─────────────────────────────────────────── */

    const DATA_EVENT = 'dsh-session-groups-data:provider';

    return {
      inject: ['slots', 'locale', 'sessionGroupsUI'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, { zh: ZH, en: EN }),
          'session-groups-data: locale dictionaries',
        );
        ctx.effect(() => {
          if (typeof document === 'undefined' || !document.head) return undefined;
          const style = document.createElement('style');
          style.dataset.dshSessionGroupsData = '';
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'session-groups-data: styles');
        const t = ctx.locale.bind(NS);

        let current = null;
        const listeners = new Set();
        const notify = () => {
          for (const listener of [...listeners]) {
            try { listener(); } catch { /* keep the overlay updatable */ }
          }
        };
        const store = {
          getSnapshot: () => current,
          subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
          open: (context) => {
            current = context;
            notify();
          },
          close: () => {
            if (current === null) return;
            current = null;
            notify();
          },
        };

        function DataOverlay(props) {
          const context = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
          if (!context) {
            return h('span', { hidden: true, 'aria-hidden': 'true' });
          }
          const title = context.title
            || t(context.kind === 'session' ? 'data.title.session' : context.kind === 'group' ? 'data.title.group' : 'data.title.workspace');
          return h(DataPanel, {
            kind: context.kind,
            title,
            sessionIds: context.sessionIds,
            pricing: loadPrefs().pricing,
            useSessions: props.useSessions,
            tr: t,
            onClose: store.close,
          });
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'session-groups-data',
          locale: NS,
        }, DataOverlay));

        ctx.effect(() => {
          const provider = {
            protocol: 1,
            id: 'session-groups-data',
            open: (context) => {
              store.open({
                kind: context.kind,
                sessionIds: Array.isArray(context.sessionIds) ? [...context.sessionIds] : [],
                title: context.title,
                target: context.target ?? {},
              });
            },
            close: () => store.close(),
            invalidate: () => {
              /* the panel owns its own fetch cache; force a reload on next open */
              liveDataCache.clear();
            },
          };
          const off = ctx.sessionGroupsUI.registerDataProvider(provider);
          return () => {
            try { off(); } catch { /* provider already gone */ }
            store.close();
          };
        }, 'session-groups-data: provider');

        // Settings are registered independently so the panel can be closed while
        // the user edits pricing. The core plugin does not own pricing.
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'session-groups-data',
          order: 81,
          label: () => t('settings.nav'),
          locale: NS,
        }, DataSettings));
      },
    };
  },
});
