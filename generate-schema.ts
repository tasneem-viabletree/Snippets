import { resolve } from "path";
import * as TJS from "typescript-json-schema";
declare var sails: any;
interface GeneratorInputs {
  filePath: string
  name: string
}
interface GeneratorExits {
  success: (definition: TJS.Definition) =>TJS.Definition
}
const settings: TJS.PartialArgs = {
  required: true
};
const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

const formatSchema = (obj: TJS.Definition) => {
   const format = (layer: TJS.Definition) => {
      const keys = Object.keys(layer)
      keys.forEach(key => {
        if (key === "properties" || layer[key]?.hasOwnProperty("properties")) {
          let newProperties = {}
          let nextRequired = []
          if(key === "properties") {
            newProperties = Object.assign(layer, layer[key]);
            nextRequired = layer["required"]
            delete layer["type"]
            delete layer["required"]
            delete layer[key];
          } else {
            newProperties = Object.assign(layer[key], layer[key]["properties"]);
            nextRequired = layer[key]["required"] || []
            newProperties["required"] = layer["required"].includes(key)
            delete layer[key]["properties"];
          }
          if(newProperties["type"] === "object") {
             newProperties["type"] = "ref"
          }
          format({ ...newProperties, required: nextRequired  })
        } else if (key !== 'type' && key !== 'required') {
          layer[key]["required"] = layer["required"]?.includes(key) || false
        }
      })
      return layer
  }
    delete obj.$schema
    return format(obj);
}
module.exports = {
  friendlyName: 'Generate Schema',
  description: 'Generate schema from types!',
  sync: true,
  inputs: {
    filePath: {
      type: 'string',
      example: 'my-type.ts',
      description: 'The path to your type file.',
      required: true
    },
    name: {
      type: 'string',
      example: 'myType',
      description: 'The type name',
      required: true
    }
  },
  fn: function (inputs: GeneratorInputs, exits: GeneratorExits) {
    try {
      const typePath = resolve(`./api/interfaces/${inputs.filePath}`)
      sails.log.info(`generating inputs for type: ${inputs.name} at path: ${typePath}...`)
      const program = TJS.getProgramFromFiles(
        [typePath],
        compilerOptions
      )
      const schema = (TJS.generateSchema(program, inputs.name, settings));
      console.log(schema);
      sails.log(schema);
      const schema2 = formatSchema(schema);
      return exits.success(schema);
    } catch (err) {
      throw new Error(`Could not generate types: `)
    }
  }
}
