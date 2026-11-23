# DSH Session Groups Data

Optional data-panel extension for
[`dsh-session-groups`](https://github.com/xyzYaeMiko/dsh-session-groups).

It contributes the session/group/workspace data view (tokens, context, model,
file, cost and tool statistics), its peak/off-peak pricing settings, and its own
Host data bridge. It does not render or replace the sidebar.

## Requirements

- DSH `>=0.2.1-rc.2 <0.3.0`
- `dsh-session-groups >=0.7.1` installed first

Install the core plugin, then this extension. The data menu is hidden while the
core service is absent.

## Install

From the DSH plugin manager, choose this repository/directory. With the CLI:

```bash
dsh plugin install /path/to/dsh-session-groups-data
```

The extension contributes:

- `sessionGroupsUI` data provider (`protocol: 1`)
- a `shell.overlay` data panel
- a `settings.section` page for peak/off-peak pricing
- Host route `/dsh-session-groups-data-bridge/data`

The Host route and core `/data` removal need a full DSH Host restart after
upgrade; refreshing the browser alone only reloads the Client.
