import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://api.octopus.energy/v1/graphql/",
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
        useTypeImports: true,
        avoidOptionals: {
          field: true,
          object: true,
          inputValue: false,
          defaultValue: true,
        },
        scalars: {
          Date: "string",
          DateTime: "string",
          Time: "string",
          BigInt: "string",
          Decimal: "string",
          JSONString: "string",
        },
      },
    },
    "./schema.graphql": {
      plugins: ["schema-ast"],
      config: { includeDirectives: true },
    },
  },
};
export default config;
