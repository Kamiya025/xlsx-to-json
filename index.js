const fs = require("fs")
const path = require("path")
const xlsx = require("xlsx")

// Đường dẫn input và output
const inputDir = path.join(__dirname, "input_files")
const outputDir = path.join(__dirname, "output_files")

// Tạo thư mục output nếu chưa tồn tại
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}

// Tìm file Excel đầu tiên trong input_files
const files = fs.readdirSync(inputDir)
const xlsxFiles = files.filter((file) => file.endsWith(".xlsx"))
if (!xlsxFiles.length === 0) {
  throw new Error("Không tìm thấy file .xlsx nào trong thư mục input_files")
}

// Hàm chuyển KEY sang dạng cây json
function convertKeys(inputObject) {
  const outputObject = {}
  for (const key in inputObject) {
    const keys = key.split(".")
    let nested = outputObject
    for (let i = 0; i < keys.length - 1; i++) {
      nested[keys[i]] = nested[keys[i]] || {}
      nested = nested[keys[i]]
    }
    nested[keys[keys.length - 1]] = inputObject[key]
  }
  return outputObject
}

// Chuyển sheet data theo từng cột ngôn ngữ (trừ KEY)
function configToLangRecords(sheetData) {
  const langMap = {}
  sheetData.forEach((row) => {
    const key = row["KEY"]
    if (!key) return
    Object.keys(row).forEach((col) => {
      if (col !== "KEY") {
        langMap[col] = langMap[col] || {}
        langMap[col][key.trim()] =
          typeof row[col] === "string" ? row[col].trim() : row[col] ?? ""
      }
    })
  })
  return langMap
}
xlsxFiles.forEach((filename) => {
  const filePath = path.join(inputDir, filename)
  const workbook = xlsx.readFile(filePath)
  const baseName = path.parse(filename).name // Tên file không có đuôi .xlsx
  const outWorkbook = path.join(outputDir, baseName)
  if (!fs.existsSync(outWorkbook)) {
    fs.mkdirSync(outWorkbook)
  }
  // Xử lý từng sheet
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(sheet)
    const langRecords = configToLangRecords(data)

    Object.entries(langRecords).forEach(([lang, records]) => {
      const nestedJson = convertKeys(records)
      const langDir = path.join(outWorkbook, lang.toLowerCase())
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir)
      }
      const outPath = path.join(langDir, `${sheetName}.json`)
      fs.writeFileSync(outPath, JSON.stringify(nestedJson, null, 2))
    })
  })
  console.log(`✅ Xử lý xong file ${filename}`)
})
console.log("Xuất tất cả file JSON theo sheet và ngôn ngữ thành công!")
