# I18N-tools

Utility for building and compiling I18N bundles.

The project uses tools from [FormatJS](https://formatjs.io/), if your project uses other tools it may not work for you.

**Install globally:**
`npm install @code-obos/i18n-tools -g`

**Install in project:**
`npm install @code-obos/i18n-tools --save-dev`

## Usage

```shell
Usage: i18n-tool [options] [command]

Utility for building and compiling I18N bundles

Options:
  -h, --help                         display help for command

Commands:
  build [options] <srcDir> <outDir>  Bundles files in <srcDir> into i18n files
  watch [options] <srcDir> <outDir>  Starts watching and rebundling files in <srcDir> into i18n files
  validate <srcDir>                  Validate that every locale contains the same set of keys
  fix <srcDir>                       Attempts to fix validation issues by creating missing files
  help [command]                     display help for command
```

### Build/Watch: package and compile intl files

```shell
Usage: i18n-tool build [options] <srcDir> <outDir>

Bundles files in <srcDir> into i18n files

Arguments:
  srcDir                     source folder of your i18n files
  outDir                     output folder for your i18n bundles

Options:
  -f, --format <format>      Output format (choices: "script", "json", "jsonlut", "formatjs", default: "formatjs")
  --typescript               Output script files with typescript (default: false)
  --strict                   Run validation before bundling (default: false)
  --ast                      Compile generated bundles (only availble with formatjs) (default: false)
  --lut                      Generate look-up-table (only availble with formatjs) (default: false)
  -t, --timeZone <timezone>  Inject timezone into date/time skeletons
  -h, --help                 display help for command

Examples:

- Bundle files into a json file following the formatjs-format
i18n-tool build example/messages example/compiled --ast --lut --typescript
```

#### The different formats;

**script** generates `bundle_[locale].js`

```javascript
const texts = {
    'group-by-page/title': 'The folder structure is preserved in the look-up-table.',
};

export default texts;
```

Use `--typescript` to change the file extension

**json** generates `bundle_[locale].json`

```json
{
    "group-by-page/title": "The folder structure is preserved in the look-up-table."
}
```

**jsonlut** generates `bundle_[locale].json`

```json
{
    "group-by-page": {
        "title": "The folder structure is preserved in the look-up-table."
    }
}
```

**formatjs** generates `bundle_[locale].json`

```json
{
    "group-by-page/title": {
        "defaultMessage": "The folder structure is preserved in the look-up-table."
    }
}
```

### Validate: check if all files are present for all locales

```shell
Usage: i18n-tool validate [options] <srcDir>

Validate that every locale contains the same set of keys

Arguments:
  srcDir      source folder of your i18n files

Options:
  -h, --help  display help for command
```

### Fix: create missing files

```shell
Usage: i18n-tool fix [options] <srcDir>

Attempts to fix validation issues by creating missing files

Arguments:
  srcDir      source folder of your i18n files

Options:
  -h, --help  display help for command
```
