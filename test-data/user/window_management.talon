os: windows
-
# Window snapping and management commands
snap {user.snap_targets}: key({user.snap_targets})
window {user.snap_targets}: key({user.snap_targets})
move {user.snap_targets}: key({user.snap_targets})

# Specific snap commands for common usage
snap full: key(win-up win-up)
snap center: key(win-z)
snap left: key(win-left)
snap right: key(win-right)
snap top: key(win-up)
snap bottom: key(win-down)
snap top left: key(win-left win-up)
snap top right: key(win-right win-up)
snap bottom left: key(win-left win-down)
snap bottom right: key(win-right win-down)
snap half left: key(win-left)
snap half right: key(win-right)
snap quarter top left: key(win-left win-up)
snap quarter top right: key(win-right win-up)
snap quarter bottom left: key(win-left win-down)
snap quarter bottom right: key(win-right win-down)
snap third left: key(win-left win-left)
snap third right: key(win-right win-right)

# Window state management
maximize window: key(win-up)
minimize window: key(win-down)
restore window: key(win-down)
close window: key(alt-f4)

# Window switching
switch window: key(alt-tab)
next window: key(alt-tab)
previous window: key(alt-shift-tab)
move window: key(alt-space) key(m)
resize window: key(alt-space) key(s)

# Virtual desktop management
new desktop: key(win-ctrl-d)
close desktop: key(win-ctrl-f4)
switch desktop left: key(win-ctrl-left)
switch desktop right: key(win-ctrl-right)
task view: key(win-tab)