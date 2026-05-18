| [index](../README.md) | [npm-run-all](npm-run-all.md) | run-s | [run-p](run-p.md) | [Node API](node-api.md) |
|-----------------------|-------------------------------|-------|-------------------|-------------------------|

# `run-s` command

A CLI command to run given npm-scripts sequentially.
This command is the shorthand of `npm-run-all -s`.

```
Usage:
    $ run-s [--help | -h | --version | -v]
    $ run-s [OPTIONS] <tasks>

    Run given npm-scripts sequentially.

    <tasks> : A list of npm-scripts' names and Glob-like patterns.

Options:
    -c, --continue-on-error  - Set the flag to continue executing subsequent
                               tasks even if a task threw an error. 'run-s'
                               itself will exit with non-zero code if one or
                               more tasks threw error(s).
    --npm-path <string>  - - - Set the path to npm. Default is the value of
                               environment variable npm_execpath.
                               If the variable is not defined, then it's "npm."
                               In this case, the "npm" command must be found in
                               environment variable PATH.
    -l, --print-label  - - - - Set the flag to print the task name as a prefix
                               on each line of output. Tools in tasks may stop
                               coloring their output if this option was given.
    -n, --print-name   - - - - Set the flag to print the task name before
                               running each task.
    -s, --silent   - - - - - - Set 'silent' to the log level of npm.
    -x, --node-run   - - - - - Use `node --run` to execute scripts instead of
                               the package manager. This is faster but
                               intentionally omits: pre/post lifecycle hooks
                               and npm_* environment variables. node_modules/.bin
                               is still added to PATH. Sets NODE_RUN_SCRIPT_NAME
                               and NODE_RUN_PACKAGE_JSON_PATH instead.
                               Can also be enabled project-wide by setting
                               `"npm-run-all2": { "nodeRun": true }` in
                               package.json.

    Shorthand aliases can be combined.
    For example, '-clns' equals to '-c -l -n -s'.

Examples:
    $ run-s build:**
    $ run-s lint clean build:**
    $ run-s --silent --print-name lint clean build:**
    $ run-s -sn lint clean build:**
```

### npm-scripts

It's `"scripts"` field of `package.json`.
For example:

```json
{
    "scripts": {
        "clean": "rm -rf dist",
        "lint":  "eslint src",
        "build": "babel src -o lib"
    }
}
```

We can run a script with `npm run` command.
On the other hand, this `run-s` command runs multiple scripts sequentially.

The following 2 commands are the same.
The `run-s` command is shorter.

```
$ run-s clean lint build
$ npm run clean && npm run lint && npm run build
```

**Note:** If a script exited with a non-zero code, the following scripts are not run.

### Glob-like pattern matching for script names

We can use [glob]-like patterns to specify npm-scripts.
The difference is one -- the separator is `:` instead of `/`.

```
$ run-s build:*
```

In this case, runs sub scripts of `build`. For example: `build:html`, `build:js`.
But, doesn't run sub-sub scripts. For example: `build:js:index`.

```
$ run-s build:**
```

If we use a globstar `**`, runs both sub scripts and sub-sub scripts.

`run-s` reads the actual npm-script list from `package.json` in the current directory, then filters the scripts by glob-like patterns, then runs those.

#### Script execution order with glob patterns

When using glob patterns with `run-s`, matched scripts are run in the order they are defined in `package.json`. This ordering is guaranteed by the [ECMAScript specification](https://tc39.es/ecma262/#sec-ordinaryownpropertykeys), which requires that string-keyed properties are iterated in chronological order of creation (i.e., the order they appear in the file). Note: the spec treats pure-integer keys (e.g. `"1"`, `"10"`) as array indices and sorts them numerically before other keys — avoid using bare numbers as script names if order matters.

**Note:** Some tools (formatters, sorters) may rewrite `package.json` with scripts sorted alphabetically. If strict execution order matters, consider:

- Prefixing script names with numbers (e.g. `build:1:html`, `build:2:js`) so they sort correctly even after an alphabetical reorder.
- Using explicit script names instead of glob patterns to guarantee order regardless of `package.json` layout.

### Run with arguments

We can enclose a script name or a pattern in quotes to use arguments.
The following 2 commands are the same.

```
$ run-s start:server "delay 3000" start:client
$ npm run start:server && npm run delay 3000 && npm run start:client
```

When we use a pattern, arguments are forwarded to every matched script.

### Argument placeholders

We can use placeholders to give the arguments preceded by `--` to scripts.

```
$ run-s build "start-server -- --port {1}" -- 8080
```

This is useful to pass through arguments from `npm run` command.

```json
{
    "scripts": {
        "start": "run-s build \"start-server -- --port {1}\" --"
    }
}
```

```
$ npm run start 8080

> example@0.0.0 start /path/to/package.json
> run-s build "start-server -- --port {1}" -- "8080"
```

There are the following placeholders:

- `{1}`, `{2}`, ... -- An argument. `{1}` is the 1st argument. `{2}` is the 2nd.
- `{@}` -- All arguments.
- `{*}` -- All arguments as combined.
- `{%}` -- Repeats the command for every argument. (There's no equivalent shell parameter and does not support suffixes)

Support for following suffixes:

- `{1-=foo}` -- defaults to `'foo'` here when the 1st argument is missing
- `{1:=foo}` -- defaults to `'foo'` here and in all following `{1}` when the 1st argument is missing

Those are similar to [Shell Parameters](http://www.gnu.org/software/bash/manual/bashref.html#Shell-Parameters). But please note arguments are enclosed by double quotes automatically (similar to npm).

### Known Limitations

- If `--print-label` option is given, some tools in scripts might stop coloring their output.
  Because some coloring library (e.g. [chalk]) will stop coloring if `process.stdout` is not a TTY.
  `run-s` changes the `process.stdout` of child processes to a pipe in order to add labels to the head of each line if `--print-label` option is given.<br>
  For example, [eslint] stops coloring under `run-s --print-label`. But [eslint] has `--color` option to force coloring, we can use it.

[glob]: https://www.npmjs.com/package/glob#glob-primer
[chalk]: https://www.npmjs.com/package/chalk
[eslint]: https://www.npmjs.com/package/eslint
