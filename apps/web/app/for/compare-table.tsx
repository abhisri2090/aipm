import tableStyles from "../compatibility/compatibility.module.css";
import { GuideInline } from "../../components/guide-inline";
import { FOR_TOOL_COMPARE } from "../../lib/for-tool-landings";

export function ForToolCompareTable() {
  return (
    <div className={tableStyles.tableWrap}>
      <table className={tableStyles.matrix}>
        <caption className={tableStyles.note}>{FOR_TOOL_COMPARE.caption}</caption>
        <thead>
          <tr>
            {FOR_TOOL_COMPARE.columns.map((column) => (
              <th key={column || "topic"} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FOR_TOOL_COMPARE.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th className={tableStyles.formatName} key={index} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={index}>
                    <GuideInline text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
