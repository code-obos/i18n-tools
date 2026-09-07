import { NestedDirectoryJSON } from 'memfs/lib/volume';

/**
 * Mirrors how @code-obos/i18n-tools is used in nybolig-nettsider (apps/frontend):
 *
 *   i18n-tool build src/intl/messages src/intl/compiled \
 *       --strict --ast --lut --typescript --timeZone Europe/Oslo
 *
 * The message contents here are synthetic, but every structural trait of the real
 * message folder is reproduced:
 *   - two locales, nb + sv, with identical key sets (required by --strict)
 *   - up to four levels of nested folders
 *   - kebab-cased folder and file names alongside camelCased ones, including
 *     'salesassignment-table' and 'salesassignmentTable' which collapse into the
 *     same LUT key
 *   - .html messages containing tags next to .txt messages
 *   - files without a locale suffix, which must be ignored
 *   - multi-line ICU: plurals nested three deep, selects with UPPER_SNAKE options,
 *     and an argument reused inside its own select
 */
export const nyboligMessages: NestedDirectoryJSON = {
    'README.md': 'Not a message, has no locale suffix.',
    'close_nb.txt': 'Lukk',
    'close_sv.txt': 'Stäng',
    'bkmLabel_nb.txt': `{bkmModel, select,
  PARTOWNERSHIP {Deleie}
  START_LIVING {Bostart}
  PROPERTY_SWAP {Boligbytte}
  other {{bkmModel}}
}`,
    'bkmLabel_sv.txt': `{bkmModel, select,
  PARTOWNERSHIP {Delagt}
  START_LIVING {Bostart}
  PROPERTY_SWAP {Bostadsbyte}
  other {{bkmModel}}
}`,
    'plannedProjectsMatched_nb.txt': `{ region_selected, select,
  true {Planlagte prosjekter i området}
  other {Planlagte prosjekter}
}`,
    'plannedProjectsMatched_sv.txt': `{ region_selected, select,
  true {Planerade projekt i området}
  other {Planerade projekt}
}`,
    'searchMatchHeading_nb.txt': `{count_properties, plural,
  =0 {
    {count_project, plural,
      =0 {
        {count_planned_project, plural,
          =0 {Ingen treff}
          one {Treff på # kommende prosjekt}
          other {Treff på # kommende prosjekter}
        }
      }
      other {
        Fant {count_project,plural,=1{# prosjekt} other {# prosjekter}}
        {count_planned_project, plural,
          =0 {}
          one {og # kommende prosjekt}
          other {og # kommende prosjekter}
        }
      }
    }
  }
  one {Treff på # ledig bolig}
  other {Treff på # ledige boliger}
}`,
    'searchMatchHeading_sv.txt': `{count_properties, plural,
  =0 {
    {count_project, plural,
      =0 {
        {count_planned_project, plural,
          =0 {Inga träffar}
          one {Träff på # kommande projekt}
          other {Träff på # kommande projekt}
        }
      }
      other {
        Träff på {count_project,plural,=1{# projekt} other {# projekt}}
        {count_planned_project, plural,
          =0 {}
          one {och # kommande projekt}
          other {och # kommande projekt}
        }
      }
    }
  }
  one {Träff på # ledig bostad}
  other {Träff på # lediga bostäder}
}`,
    anchors: {
        tabs: {
            'default_nb.txt': 'Oversikt',
            'default_sv.txt': 'Översikt',
        },
    },
    commonProjectAndProperty: {
        informationmeeting: {
            'formIntro_nb.html': '<p>\n  Om informasjonsmøtet.\n</p>\n\n<p>\n  Velkommen.\n</p>\n',
            'formIntro_sv.html': '<p>[TODO]</p>',
        },
    },
    propertyProject: {
        banners: {
            'comingForSaleBodyText_nb.html': '<p>\n  { propertyProjectName} kommer snart for salg.\n</p>\n',
            'comingForSaleBodyText_sv.html': '<p>\n  { propertyProjectName} kommer snart till försäljning.\n</p>\n',
        },
        newLeadForm: {
            part1: {
                'heading_nb.txt': 'Om deg',
                'heading_sv.txt': 'Om dig',
            },
            receipt: {
                'heading_nb.txt': 'Takk',
                'heading_sv.txt': 'Tack',
            },
        },
    },
    'salesassignment-table': {
        parking: {
            'assigned-spaces_nb.txt': 'Tildelte plasser',
            'assigned-spaces_sv.txt': 'Tilldelade platser',
            'electric-charging-for-sale_nb.txt': 'Ladeplass til salgs',
            'electric-charging-for-sale_sv.txt': 'Laddplats till försäljning',
        },
    },
    salesassignmentTable: {
        heading: {
            'unitTBA_nb.txt': 'BRA',
            'unitTBA_sv.txt': 'BOA',
        },
    },
    'traffic-split': {
        'mobileCta_nb.txt': 'Se boliger',
        'mobileCta_sv.txt': 'Se bostäder',
    },
};

/** The exact flags apps/frontend passes to `i18n-tool build`. */
export const nyboligBuildFlags = ['--strict', '--ast', '--lut', '--typescript', '--timeZone', 'Europe/Oslo'];

/** The same flags as a BuildOptions object, for calling runBuildCommand directly. */
export const nyboligBuildOptions = {
    format: 'formatjs' as const,
    strict: true,
    ast: true,
    lut: true,
    typescript: true,
    timeZone: 'Europe/Oslo',
};
