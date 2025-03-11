# **SE ToolBox (Filters Module) - User Guide**

This document provides an overview of how to use the Filters functionality within the SE ToolBox application. The steps below explain what each feature does and how you, as a user, can interact with it.

---

## **Overview**

The Filters module is designed to help you:
1. **Upload** an Excel file containing information (on a specific sheet named "Powered by Cisco Ready").
2. **Apply Filters** to narrow down rows (based on Business Entity, Product Family, or any other columns).
3. **Compare Two Sets of Filters** (Set A and Set B) using different logic operations (difference, intersection, union, etc.).
4. **Export** the filtered or combined results back to an Excel file with useful extra sheets (Summary, Set A results, Overlap, Full Report, and an optional Pivot).

---

## **Key Concepts**

1. **Session**  
   - When you upload a file, the system creates a **session_id**. This session tracks your Excel data in memory so you can apply filters without repeatedly uploading the file.
   - **Important**: Keep note of the session_id when you upload your file, because you’ll need it to apply filters or export.

2. **Required Columns**  
   - The system expects your Excel data to have these columns:
     - **Business Entity**
     - **Sub Business Entity**
     - **Asset Type**
     - **Product Type**
     - **Product Family**
     - **Product ID**
     - **SAV Name**
     - **Product Description**
   - If any of these are missing, the system will display an error.

3. **Filters**  
   - Filters let you choose specific values in a column. For instance, you can filter `Business Entity` to `[“Security”, “Collaboration”]` or `Product Family` to `[“Routers”]`.
   - The system will only keep the rows that match the chosen values.

4. **Sets of Filters**: **A** and **B**  
   - You can create two separate sets of filters, called **Filters A** and **Filters B**.
   - Each set can independently narrow down data.

5. **Logic Types**  
   - Once you have Filters A and Filters B, you can combine them in several ways:
     1. **Difference (A but not B)** – Keep rows that match A but exclude rows that also match B.
     2. **Intersection (A and B)** – Keep only rows that match both A and B.
     3. **Only A** – Return rows for A alone, ignoring B.
     4. **Only B** – Return rows for B alone, ignoring A.
     5. **Union (A or B)** – Keep rows that match A or B (or both).

---

## **Using the Application**

### 1. **Upload Your Excel File**
1. Go to the **Upload** section of the Filters module.
2. Select or drag-and-drop your Excel file (must contain a sheet named “Powered by Cisco Ready”).
3. When you confirm, the application reads the sheet and returns a **session_id**.

**TIP**: Copy or note the **session_id**; you will need it to apply further actions.

---

### 2. **Retrieve Unique Values for a Column** (Optional Step)
As you build your filters, you may want to see which values are possible for a certain column (e.g., “Product Type”). You can:
1. Use the **session_id** from above.
2. Select the **column** you’re interested in.
3. Provide any existing **filters** you have so far.  
   - The system returns all unique values in that column that match your current filters.

This is especially helpful if you need to understand what options exist before finalizing your selection.

---

### 3. **Set Up Filters A and B**
Create two filter sets (A and B). For example:
- **Filters A** might narrow the data to certain “Business Entity” and “Product Family” values.
- **Filters B** might narrow the data based on different “Product Type” or “Sub Business Entity” values.

You can think of this like two separate lists of conditions that you’ll combine later.

---

### 4. **Finalize Your Selection**
Use the **Finalize** option to combine Filters A and B with your chosen **logic type**. For example:
- **Difference**: Return results in A that are not in B.
- **Intersection**: Only rows that appear in both A and B.
- **Union**: All rows that appear in A or B (or both).

The result of this step is a list of **SAV Names** that match your combination of conditions.

---

### 5. **Export to Excel** (Generate Detailed Output)
Finally, if you need a full report:
1. Use the same **session_id** and provide your **Filters A**, **Filters B**, and desired **logic type**.
2. The system will generate an Excel file containing:
   - **Summary**: A sheet showing which filters were used (A and B) and a list of the final SAV Names that match the logic.
   - **SetA_SKUs**: Rows that match Filters A.
   - **SetB_in_A**: The overlap rows (only if relevant)—helps show items in A that also match B’s SAV Names.
   - **Full Report**: All rows from your original file (for reference).
   - **Pivot Summary** (optional): A quick table (pivot) summarizing the final results by “Product Family” vs “Product Type” (if applicable).

This exported file helps you see what was filtered, what the final results were, and how they might be summarized.

---

## **Key Points to Remember**

- **Keep track of the session_id** every time you upload a file. It’s essential for applying filters and exporting the data.
- All filters are **case-insensitive** in the sense that the system converts data to strings internally.  
  _(Example: if your data has “SECURITY” vs. “Security,” they will be treated the same if you type “Security” in the filter.)_
- The **logic type** selected determines how Filters A and B are combined. Be sure to pick the one that fits your use case.
- The **Summary** sheet in the final Excel provides a convenient reference of everything you did, so you don’t have to remember all filters manually.

---

## **Troubleshooting**

- **Missing Required Column**: If you see an error about missing a required column (e.g. “Missing required column: SAV Name”), make sure your Excel file has the exact expected column names.
- **Empty or Wrong Sheet**: If the “Powered by Cisco Ready” sheet doesn’t exist or is blank, you will get an error during upload.
- **Session Not Found**: Ensure you are using the correct **session_id** from your upload step.


---

**Thank you for using the Filters module in SE ToolBox!**
