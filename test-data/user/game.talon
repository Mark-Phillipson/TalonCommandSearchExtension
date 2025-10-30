app: game
-
# Game commands with arrow keys
game {user.arrow_key}: key({user.arrow_key})
move {user.arrow_key}: 
    key({user.arrow_key})
    sleep(100ms)
    key({user.arrow_key})