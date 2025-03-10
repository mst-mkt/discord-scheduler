<div align="center">

# discord-scheduler

A discord bot for managing tasks and schedules.

[🔥 install](https://discord.com/oauth2/authorize?client_id=1347884369653661779)

</div>

## features

- Manage tasks
- Manage schedules
- Notify schedules on the day

## commands

- `task`: Manage tasks
  - `create`: Create a new task
  - `delete`: Delete a task
  - `list`: List all tasks
  - `done`: Mark a task as done
- `schedule`: Manage schedules
  - `create`: Create a new schedule
  - `delete`: Delete a schedule
  - `list`: List all schedules

## deploy

1. Register a command on discord

```sh
pnpm register
```

2. Deploy the api server

```sh
pnpm run deploy
```

## environment variables (`.dev.vars`)

- `DISCORD_APPLICATION_ID`
- `DISCORD_CLIENT_ID`
- `DISCORD_TOKEN`
