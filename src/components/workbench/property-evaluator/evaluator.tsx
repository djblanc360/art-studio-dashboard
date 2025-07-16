"use client"

import { useQuery } from "@tanstack/react-query"
import Papa from "papaparse"
import { FileUploader } from "./file-uploader"

export default function PropertyEvaluator() {

  const handleFileUpload = (data: CsvData, fileName: string) => {
    const parsedData = Papa.parse(data, { header: true }).data
    console.log(parsedData)
  }
}