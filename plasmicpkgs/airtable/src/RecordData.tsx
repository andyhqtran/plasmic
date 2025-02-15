import {
  ComponentMeta,
  DataProvider,
  GlobalContextMeta,
  registerComponent,
  registerGlobalContext,
  repeatedElement,
  useSelector,
} from "@plasmicapp/host";
import { CanvasComponentProps } from "@plasmicapp/host/dist/registerComponent";
import { usePlasmicQueryData } from "@plasmicapp/query";
import React from "react";

const defaultHost = "https://studio.plasmic.app";

const CredentialsContext = React.createContext<
  AirtableCredentialsProviderProps | undefined
>(undefined);

interface RecordData {
  [field: string]: string | { id: string; url: string; filename: string }[];
}

export interface AirtableRecordProps {
  dataSourceId?: string;
  base?: string;
  table: string;
  record: string;
}

export function AirtableRecord({
  table,
  record,
  children,
  ...props
}: React.PropsWithChildren<AirtableRecordProps>) {
  const credentialsContext = React.useContext(CredentialsContext);
  const base = props.base ?? credentialsContext?.base;
  const dataSourceId = props.dataSourceId ?? credentialsContext?.dataSourceId;
  const host = credentialsContext?.host ?? defaultHost;

  const data = usePlasmicQueryData(
    JSON.stringify(["AirtableRecord", host, base, table, record, dataSourceId]),
    async () => {
      if (!base || !dataSourceId || !table) {
        throw new Error(
          "AirtableRecord needs base ID, table and Data Source ID"
        );
      }
      const pathname = `/${base}/${table}/${record}`;
      const url = `${host}/api/v1/server-data-sources/query?pathname=${encodeURIComponent(
        pathname
      )}&dataSourceId=${dataSourceId}`;
      return (await (await fetch(url, { method: "GET" })).json())
        .fields as RecordData;
    }
  );

  if ("error" in data) {
    return <p>Error: {data.error?.message}</p>;
  }

  if (!("data" in data)) {
    return <p>Loading...</p>;
  }

  return (
    <DataProvider name={contextKey} data={data.data}>
      {children}
    </DataProvider>
  );
}

const contextKey = "__airtableRecord";

function useRecord() {
  return useSelector(contextKey) as RecordData | undefined;
}

export interface AirtableRecordFieldProps
  extends CanvasComponentProps<RecordData | undefined> {
  className?: string;
  style?: React.CSSProperties;
  field?: string;
}

export function AirtableRecordField({
  className,
  field,
  style,
  setControlContextData,
}: AirtableRecordFieldProps) {
  const record = useRecord();
  setControlContextData?.(record);

  return (
    <div className={className} style={style}>
      {record
        ? (() => {
            const val = record[field || Object.keys(record)[0]];
            if (val && typeof val === "object") {
              return "Attachment " + val[0].filename;
            }
            return val;
          })()
        : "Error: Must provide a record to AirtableRecordField"}
    </div>
  );
}

export interface AirtableCollectionProps {
  dataSourceId?: string;
  base?: string;
  table: string;
  fields?: string[];
  filterByFormula?: string;
  maxRecords?: number;
  pageSize?: number;
  sort?: {
    field: string;
    direction?: "asc" | "desc";
  }[];
  view?: string;
}

export function AirtableCollection({
  table,
  children,
  ...props
}: React.PropsWithChildren<AirtableCollectionProps>) {
  const credentialsContext = React.useContext(CredentialsContext);
  const base = props.base ?? credentialsContext?.base;
  const dataSourceId = props.dataSourceId ?? credentialsContext?.dataSourceId;
  const host = credentialsContext?.host ?? defaultHost;

  const searchArray: string[] = [];
  if (props.fields) {
    props.fields.forEach((f) =>
      searchArray.push(
        `${encodeURIComponent(`fields[]`)}=${encodeURIComponent(`${f}`)}`
      )
    );
  }
  (["filterByFormula", "maxRecords", "pageSize", "view"] as const).forEach(
    (prop) => {
      if (props[prop]) {
        searchArray.push(
          `${encodeURIComponent(`${prop}`)}=${encodeURIComponent(
            `${props[prop]}`
          )}`
        );
      }
    }
  );
  if (props.sort) {
    props.sort.forEach((v, i) => {
      searchArray.push(
        `${encodeURIComponent(`sort[${i}][field]`)}=${encodeURIComponent(
          `${v.field}`
        )}`
      );
      if (v.direction) {
        searchArray.push(
          `${encodeURIComponent(`sort[${i}][direction]`)}=${encodeURIComponent(
            `${v.direction}`
          )}`
        );
      }
    });
  }

  const search = searchArray.length === 0 ? "" : "?" + searchArray.join("&");

  const data = usePlasmicQueryData(
    JSON.stringify([
      "AirtableCollection",
      host,
      base,
      table,
      search,
      dataSourceId,
    ]),
    async () => {
      if (!base || !dataSourceId || !table) {
        throw new Error(
          "AirtableRecord needs base ID, table and Data Source ID"
        );
      }
      const pathname = `/${base}/${table}${search}`;
      const url = `${host}/api/v1/server-data-sources/query?pathname=${encodeURIComponent(
        pathname
      )}&dataSourceId=${dataSourceId}`;
      return (await (await fetch(url, { method: "GET" })).json()).records as {
        fields: RecordData;
        id: string;
      }[];
    }
  );

  if ("error" in data) {
    return <p>Error: {data.error?.message}</p>;
  }

  if (!("data" in data)) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {data.data!.map((record, index) => (
        <DataProvider key={record.id} name={contextKey} data={record.fields}>
          {repeatedElement(index === 0, children)}
        </DataProvider>
      ))}
    </>
  );
}

interface AirtableCredentialsProviderProps {
  dataSourceId: string;
  base: string;
  host?: string;
}

export function AirtableCredentialsProvider({
  base,
  dataSourceId,
  host: maybeHost,
  children,
}: React.PropsWithChildren<AirtableCredentialsProviderProps>) {
  const host = maybeHost || defaultHost;
  return (
    <CredentialsContext.Provider value={{ base, dataSourceId, host }}>
      {children}
    </CredentialsContext.Provider>
  );
}

const thisModule = "@plasmicpkgs/airtable";

export const airtableRecordMeta: ComponentMeta<AirtableRecordProps> = {
  name: "hostless-airtable-record",
  displayName: "Airtable Record",
  importPath: thisModule,
  importName: "AirtableRecord",
  props: {
    children: {
      type: "slot",
      defaultValue: {
        type: "component",
        name: "hostless-airtable-record-field",
      },
    },
    table: {
      type: "string",
      displayName: "Table Name",
      description: "The Airtable table name or ID",
    },
    record: {
      type: "string",
      displayName: "Record",
      description: "The table record ID",
    },
    base: {
      type: "string",
      displayName: "Base",
      defaultValueHint: "Read from Credentials Provider",
      description:
        "The Airtable Base (if not provided by the Credentials Provider)",
    },
    dataSourceId: {
      type: "string",
      displayName: "Data Source ID",
      defaultValueHint: "Read from Credentials Provider",
      description: "The Data Source ID with the Airtable secrets",
    },
  },
};

export function registerAirtableRecord(
  loader?: { registerComponent: typeof registerComponent },
  customAirtableRecordMeta?: ComponentMeta<AirtableRecordProps>
) {
  if (loader) {
    loader.registerComponent(
      AirtableRecord,
      customAirtableRecordMeta ?? airtableRecordMeta
    );
  } else {
    registerComponent(
      AirtableRecord,
      customAirtableRecordMeta ?? airtableRecordMeta
    );
  }
}

export const airtableRecordFieldMeta: ComponentMeta<AirtableRecordFieldProps> = {
  name: "hostless-airtable-record-field",
  displayName: "Airtable Record Field",
  importPath: thisModule,
  importName: "AirtableRecordField",
  props: {
    field: {
      type: "choice",
      displayName: "Field Name",
      defaultValueHint: "The first field",
      options: (_props, data) => {
        return data ? Object.keys(data) : ["Data unavailable"];
      },
    },
  },
};

export function registerAirtableRecordField(
  loader?: { registerComponent: typeof registerComponent },
  customAirtableRecordFieldMeta?: ComponentMeta<AirtableRecordFieldProps>
) {
  if (loader) {
    loader.registerComponent(
      AirtableRecordField,
      customAirtableRecordFieldMeta ?? airtableRecordFieldMeta
    );
  } else {
    registerComponent(
      AirtableRecordField,
      customAirtableRecordFieldMeta ?? airtableRecordFieldMeta
    );
  }
}

export const airtableCollectionMeta: ComponentMeta<AirtableCollectionProps> = {
  name: "hostless-airtable-collection",
  displayName: "Airtable Collection",
  importPath: thisModule,
  importName: "AirtableCollection",
  props: {
    children: {
      type: "slot",
      isRepeated: true,
      defaultValue: {
        type: "component",
        name: "hostless-airtable-record-field",
      },
    },
    table: {
      type: "string",
      displayName: "Table Name",
      description: "The Airtable table name or ID",
    },
    fields: {
      type: "object",
      displayName: "Fields",
      description: "List of strings containing the fields to be included",
    },
    maxRecords: {
      type: "number",
      displayName: "Max Records",
      description: "The maximum total number of records that will be returned",
      defaultValueHint: 100,
      max: 100,
      min: 1,
    },
    view: {
      type: "string",
      displayName: "View",
      description:
        "The name or ID of a view in the table. If set, only records from that view will be returned",
    },
    sort: {
      type: "object",
      displayName: "Sort",
      description:
        'A list of Airtable sort objects that specifies how the records will be ordered. Each sort object must have a field key specifying the name of the field to sort on, and an optional direction key that is either "asc" or "desc". The default direction is "asc"',
    },
    filterByFormula: {
      type: "string",
      displayName: "Filter by Formula",
      description: "An Airtable formula used to filter records",
    },
    base: {
      type: "string",
      displayName: "Base",
      defaultValueHint: "Read from Credentials Provider",
      description:
        "The Airtable Base (if not provided by the Credentials Provider)",
    },
    dataSourceId: {
      type: "string",
      displayName: "Data Source ID",
      defaultValueHint: "Read from Credentials Provider",
      description: "The Data Source ID with the Airtable secrets",
    },
  },
};

export function registerAirtableCollection(
  loader?: { registerComponent: typeof registerComponent },
  customAirtableCollectionMeta?: ComponentMeta<AirtableCollectionProps>
) {
  if (loader) {
    loader.registerComponent(
      AirtableCollection,
      customAirtableCollectionMeta ?? airtableCollectionMeta
    );
  } else {
    registerComponent(
      AirtableCollection,
      customAirtableCollectionMeta ?? airtableCollectionMeta
    );
  }
}

export const airtableCredentialsProviderMeta: GlobalContextMeta<AirtableCredentialsProviderProps> = {
  name: "hostless-airtable-credentials-provider",
  displayName: "Airtable Credentials Provider",
  importPath: thisModule,
  importName: "AirtableCredentialsProvider",
  props: {
    base: {
      type: "string",
      displayName: "Base",
      description: "The Airtable Base",
    },
    dataSourceId: {
      type: "string",
      displayName: "Data Source ID",
      description: "The Data Source ID",
    },
    host: {
      type: "string",
      displayName: "Host",
      description: "Plasmic Server-Data URL",
      defaultValueHint: defaultHost,
    },
  },
};

export function registerAirtableCredentialsProvider(
  loader?: { registerGlobalContext: typeof registerGlobalContext },
  customAirtableCredentialsProviderMeta?: GlobalContextMeta<AirtableCredentialsProviderProps>
) {
  if (loader) {
    loader.registerGlobalContext(
      AirtableCredentialsProvider,
      customAirtableCredentialsProviderMeta ?? airtableCredentialsProviderMeta
    );
  } else {
    registerGlobalContext(
      AirtableCredentialsProvider,
      customAirtableCredentialsProviderMeta ?? airtableCredentialsProviderMeta
    );
  }
}
