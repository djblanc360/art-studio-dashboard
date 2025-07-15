import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

export const file1ExampleData = [
  { Email: "test1" },
  { Email: "test2" },
  { Email: "test3" },
  { Email: "test3" },
  { Email: "test1" },
  { Email: "test3" },
  { Email: "test2" },
]

export const file2ExampleData = [
  { Email: "test" },
  { Email: "test1" },
  { Email: "test2" },
  { Email: "test4" },
  { Email: "test4" },
  { Email: "test5" },
  { Email: "test5" },
  { Email: "test4" },
  { Email: "test2" },
  { Email: "test6" },
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
        data: [{ Email: "test1" }, { Email: "test2" }, { Email: "test1" }, { Email: "test2" }],
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
      output: { name: "Output", data: [{ Email: "test3" }, { Email: "test3" }, { Email: "test3" }] },
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
          { Email: "test1" },
          { Email: "test2" },
          { Email: "test3" },
          { Email: "test" },
          { Email: "test4" },
          { Email: "test5" },
          { Email: "test6" },
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
        data: [{ Email: "test2" }, { Email: "test3" }, { Email: "test3" }, { Email: "test1" }, { Email: "test3" }],
      },
    },
    useCases: [
      "Remove specific values from a dataset.",
      "Filter out unwanted entries based on a column value.",
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
