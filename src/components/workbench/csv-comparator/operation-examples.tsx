import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

export const file1ExampleData = [
  { Email: "test1", FirstName: "John" },
  { Email: "test2", FirstName: "Jane" },
  { Email: "test3", FirstName: "Bob" },
  { Email: "test3", FirstName: "Bob" },
  { Email: "test1", FirstName: "John" },
  { Email: "test3", FirstName: "Bob" },
  { Email: "test2", FirstName: "Jane" },
]

export const file2ExampleData = [
  { Email: "test", LastName: "Unknown", Age: 25 },
  { Email: "test1", LastName: "Doe", Age: 30 },
  { Email: "test2", LastName: "Smith", Age: 28 },
  { Email: "test4", LastName: "Johnson", Age: 35 },
  { Email: "test4", LastName: "Johnson", Age: 35 },
  { Email: "test5", LastName: "Brown", Age: 40 },
  { Email: "test5", LastName: "Brown", Age: 40 },
  { Email: "test4", LastName: "Johnson", Age: 35 },
  { Email: "test2", LastName: "Smith", Age: 28 },
  { Email: "test6", LastName: "Wilson", Age: 45 },
]

export const operationDescriptions = {
  match: {
    title: "Match Operation",
    description:
      "Finds all rows in File 1 that have a matching key in File 2. The output contains only records from File 1.",
    example: {
      file1: { name: "File 1 (submissions.csv)", data: file1ExampleData },
      file2: { name: "File 2 (top-category-anime.csv)", data: file2ExampleData },
      output: {
        name: "Output",
        data: [
          { Email: "test1", FirstName: "John" }, 
          { Email: "test2", FirstName: "Jane" }, 
          { Email: "test1", FirstName: "John" }, 
          { Email: "test2", FirstName: "Jane" }
        ],
      },
    },
    useCases: [
      "Identify blacklisted emails from a Klaviyo list submissions.",
      "Only accept Klaviyo submissions that have top category of Anime.",
    ],
  },
  diff: {
    title: "Difference Operation",
    description:
      "Finds all rows in File 1 that DO NOT have a matching key in File 2. The output contains records unique to File 1.",
    example: {
      file1: { name: "File 1 (blacklist.csv)", data: file1ExampleData },
      file2: { name: "File 2 (klaviyo.csv)", data: file2ExampleData },
      output: { 
        name: "Output", 
        data: [
          { Email: "test3", FirstName: "Bob" }, 
          { Email: "test3", FirstName: "Bob" }, 
          { Email: "test3", FirstName: "Bob" }
        ] 
      },
    },
    useCases: [
      "Filter out blacklisted emails from a Klaviyo list submissions (clean list).",
    ],
  },
  combo: {
    title: "Combine Operation",
    description:
      "Combines unique rows from both File 1 and File 2 into a single list, based on the key. Duplicates are removed.",
    example: {
      file1: { name: "File 1 (list-A.csv)", data: file1ExampleData },
      file2: { name: "File 2 (list-B.csv)", data: file2ExampleData },
      output: {
        name: "Output",
        data: [
          { Email: "test1", FirstName: "John" },
          { Email: "test2", FirstName: "Jane" },
          { Email: "test3", FirstName: "Bob" },
          { Email: "test", LastName: "Unknown", Age: 25 },
          { Email: "test4", LastName: "Johnson", Age: 35 },
          { Email: "test5", LastName: "Brown", Age: 40 },
          { Email: "test6", LastName: "Wilson", Age: 45 },
        ],
      },
    },
    useCases: [
      "Creating a comprehensive list of all Klaviyo list submissions from multiple events.",
      "Aggregating Klaviyo list submissions from different sources into one file.",
    ],
  },
  filter: {
    title: "Filter Operation",
    description:
      "Filters rows from File 1 based on whether the key column matches the specified filter value.",
    example: {
      file1: { name: "File 1 (data.csv)", data: file1ExampleData },
      file2: { name: "", data: [] },
      output: {
        name: "Output",
        data: [
          { Email: "test2", FirstName: "Jane" }, 
          { Email: "test3", FirstName: "Bob" }, 
          { Email: "test3", FirstName: "Bob" }, 
          { Email: "test1", FirstName: "John" }, 
          { Email: "test3", FirstName: "Bob" }
        ],
      },
    },
    useCases: [
      "Remove specific values from a dataset.",
      "Filter out unwanted entries based on a column value.",
    ],
  },
  concat: {
    title: "Concat Operation",
    description:
      "Merges specified columns from File 2 into File 1 based on matching keys. All rows from File 1 are preserved, with additional columns added when matches are found.",
    example: {
      file1: { name: "File 1 (users.csv)", data: file1ExampleData },
      file2: { name: "File 2 (details.csv)", data: file2ExampleData },
      output: {
        name: "Output (concatenating LastName,Age)",
        data: [
          { Email: "test1", FirstName: "John", LastName: "Doe", Age: 30 },
          { Email: "test2", FirstName: "Jane", LastName: "Smith", Age: 28 },
          { Email: "test3", FirstName: "Bob" },
          { Email: "test3", FirstName: "Bob" },
          { Email: "test1", FirstName: "John", LastName: "Doe", Age: 30 },
          { Email: "test3", FirstName: "Bob" },
          { Email: "test2", FirstName: "Jane", LastName: "Smith", Age: 28 },
        ],
      },
    },
    useCases: [
      "Enrich user data with additional information from another dataset.",
      "Add supplementary columns to your main dataset based on a common identifier.",
      "Merge customer details with their order history or preferences.",
    ],
  },
}

export const ExampleTable = ({ title, data }: { title: string; data: Record<string, any>[] }) => {
  if (!data || data.length === 0) {
    return (
      <div>
        <h4 className="font-semibold text-center mb-2 text-sm text-gray-700 dark:text-gray-300">{title}</h4>
        <div className="border rounded-lg p-4 text-center text-xs text-gray-500 h-48 flex items-center justify-center">
          Empty
        </div>
      </div>
    )
  }
  const headers = Object.keys(data[0])
  return (
    <div>
      <h4 className="font-semibold text-center mb-2 text-sm text-gray-700 dark:text-gray-300">{title}</h4>
      <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="text-xs">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h} className="text-xs">
                    {row[h]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
