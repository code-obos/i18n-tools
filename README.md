# I18N-tools

Utility for building and compiling I18N bundles.

The project uses tools from [FormatJS](https://formatjs.io/), if your project uses other tools it may not work for you.

Requires Node 22.12 or newer.

**Install globally:**
`npm install @code-obos/i18n-tools -g`

**Install in project:**
`npm install @code-obos/i18n-tools --save-dev`

The generated look-up-table imports from `@formatjs/intl`, so add that too if you use `--lut`:
`npm install @formatjs/intl`

See [CHANGELOG.md](./CHANGELOG.md) for changes between versions.

## Writing messages

One message per file. The filename decides both the message id and the locale:

```
messages/
  close_nb.txt                     -> id "close",                  locale nb
  close_sv.txt                     -> id "close",                  locale sv
  camel-cased-name_en.txt          -> id "camel-cased-name",       locale en
  group-by-page/title_en.txt       -> id "group-by-page.title",    locale en
```

- The name must end in `_<locale>` before the extension. Files without a locale suffix, such as `README.md`, are ignored.
- `.txt`, `.html` and `.md` are all picked up. Use `.html` when the message contains tags.
- Folders are preserved in the id, separated by `.`, and become nested objects in the look-up-table.
- The file content is an [ICU message](https://formatjs.io/docs/core-concepts/icu-syntax/). Plurals, selects, tags and date/time skeletons all work.

Ids are always emitted in sorted order, so the generated files do not change just because a different filesystem hands out directory entries in a different order.

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
  --ast                      Compile generated bundles into AST (not available with -f script) (default: false)
  --lut                      Generate look-up-table (intended for the formatjs format) (default: false)
  -t, --timeZone <timezone>  Inject timezone into date/time skeletons
  -h, --help                 display help for command

Examples:

- Bundle files into a json file following the formatjs-format
i18n-tool build example/messages example/compiled --ast --lut --typescript
```

`watch` takes the same arguments and options as `build`, rebuilds on every change, and lets you press `f` to run the fixer without stopping.

A typical project wires both up as scripts:

```json
{
    "scripts": {
        "intl": "i18n-tool build src/intl/messages src/intl/compiled --strict --ast --lut --typescript --timeZone Europe/Oslo",
        "intl:watch": "i18n-tool watch src/intl/messages src/intl/compiled --strict --ast --lut --typescript --timeZone Europe/Oslo"
    }
}
```

#### What gets written

With `--ast --lut` and the default `formatjs` format, `outDir` ends up with:

| File                            | Written by | Purpose                                                                    |
| ------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `bundle_<locale>.json`          | always     | the messages, as ICU source strings                                        |
| `bundle_<locale>.compiled.json` | `--ast`    | the same messages pre-parsed to AST, this is what you hand to `createIntl` |
| `lut.ts` / `lut.js`             | `--lut`    | typed helper functions, one per message                                    |

`--ast` skips the runtime ICU parsing and is what you want in production. `-t/--timeZone` writes the timezone into every date/time skeleton while compiling, so formatting does not depend on the timezone of the machine rendering the page.

#### The different formats;

**script** generates `bundle_[locale].js`

```javascript
const texts = {
    'group-by-page.title': 'The folder structure is preserved in the look-up-table.',
};

export default texts;
```

Use `--typescript` to change the file extension

**json** generates `bundle_[locale].json`

```json
{
    "group-by-page.title": "The folder structure is preserved in the look-up-table."
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
    "group-by-page.title": {
        "defaultMessage": "The folder structure is preserved in the look-up-table."
    }
}
```

### Using the look-up-table

`--lut` generates a `createIntlLUT` function. Every message becomes a function whose arguments are derived from the ICU message itself, so a missing or misspelled placeholder is a type error rather than a blank spot on the page:

```typescript
export function createIntlLUT(intl: IntlShape<React.ReactNode>) {
    return {
        argument: (args: { me: string; other: string }) =>
            intl.formatMessage({ id: 'argument' }, { me: args.me, other: args.other }),
        camelCasedName: () => intl.formatMessage({ id: 'camel-cased-name' }, {}),
        groupByPage: {
            title: () => intl.formatMessage({ id: 'group-by-page.title' }, {}),
        },
    };
}
```

Note that ids keep the filename as written, while the look-up-table keys are camelCased: `camel-cased-name_en.txt` is reached as `intl.camelCasedName()`.

Wire it up once with the compiled bundle:

```typescript
import { createIntl } from '@formatjs/intl';
import messages from './intl/compiled/bundle_nb.compiled.json';
import { createIntlLUT } from './intl/compiled/lut';

const intl = createIntlLUT(
    createIntl({
        locale: 'nb',
        defaultLocale: 'nb',
        messages,
        timeZone: 'Europe/Oslo',
    }),
);

intl.groupByPage.title();
intl.argument({ me: 'Alice', other: 'Bob' });
```

Argument types follow the ICU message: `{count, plural, ...}` becomes `number`, `{when, date, ::ddMMM}` becomes `Date`, `{kind, select, A {..} B {..}}` becomes `'A' | 'B' | 'other' | string`, and a tag such as `<p>` becomes a `FormatXMLElementFn<React.ReactNode>` you can pass a renderer for.

### Validate: check if all files are present for all locales

```shell
Usage: i18n-tool validate [options] <srcDir>

Validate that every locale contains the same set of keys

Arguments:
  srcDir      source folder of your i18n files

Options:
  -h, --help  display help for command
```

Exits with an error and lists the missing ids per locale. `build --strict` and `watch --strict` run the same check before bundling.

### Fix: create missing files

```shell
Usage: i18n-tool fix [options] <srcDir>

Attempts to fix validation issues by creating missing files

Arguments:
  srcDir      source folder of your i18n files

Options:
  -h, --help  display help for command
```

Creates the missing files with the placeholder content `[<locale>] TODO`, ready to be translated.
