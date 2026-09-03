# AIPM README Badge Pull Request

Use this only after the skill maintainer has approved an AIPM listing. Replace every value in square brackets before opening a pull request.

## Pull request title

Add an AIPM install link for [skill name]

## Pull request body

This adds a version-specific AIPM badge to the README for `[skill name]`.

The badge links to `[AIPM package URL]`. That page shows the exact package version, public source, license, bundled files, integrity value, and install command.

I asked for permission before opening this pull request. This link does not claim that the maintainer endorses AIPM.

## Markdown

```markdown
[![Install with AIPM](https://www.aipm-registry.com/install-with-aipm.svg)]([AIPM package URL])
```

## Check before opening

- The maintainer approved the listing and pull request.
- The AIPM page links back to the correct source folder.
- The package name, version, license, and description are correct.
- The install command was tested in a clean project.
- The pull request changes only the README.
