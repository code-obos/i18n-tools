import React from "react";
import {IntlShape} from "@formatjs/intl";
// @ts-ignore
import {FormatXMLElementFn} from "intl-messageformat";

export function createIntlLUT(intl: IntlShape<React.ReactNode>) {
  return {
    "argument": (args: { me: string;other: string }) => intl.formatMessage({ id: 'argument' }, {me: args.me, other: args.other}),
    "camelCasedName": () => intl.formatMessage({ id: 'camel-cased-name' }, {}),
    "datePluralAndTag": (args: { div: FormatXMLElementFn<React.ReactNode>;gender: 'male' | 'female' | 'other' | string;p: FormatXMLElementFn<React.ReactNode>;date: Date }) => intl.formatMessage({ id: 'datePluralAndTag' }, {div: args.div, gender: args.gender, p: args.p, date: args.date}),
    "datetime": (args: { start_time: Date;start_date: Date }) => intl.formatMessage({ id: 'datetime' }, {start_time: args.start_time, start_date: args.start_date}),
    "groupByPage": {
      "title": () => intl.formatMessage({ id: 'group-by-page.title' }, {}),
    },
    "literal": () => intl.formatMessage({ id: 'literal' }, {}),
    "number": (args: { smallest: number;biggest: number;bagel_price: number }) => intl.formatMessage({ id: 'number' }, {smallest: args.smallest, biggest: args.biggest, bagel_price: args.bagel_price}),
    "plural": (args: { query: string;count: number }) => intl.formatMessage({ id: 'plural' }, {query: args.query, count: args.count}),
    "select": (args: { gender: 'male' | 'female' | 'other' | string }) => intl.formatMessage({ id: 'select' }, {gender: args.gender}),
    "selectordinal": (args: { position: number }) => intl.formatMessage({ id: 'selectordinal' }, {position: args.position}),
    "tag": (args: { anchor: FormatXMLElementFn<React.ReactNode> }) => intl.formatMessage({ id: 'tag' }, {anchor: args.anchor}),
  }
}