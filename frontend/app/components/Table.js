'use client';

export default function Table({ columns, data, onRowClick }) {
  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-3 md:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 md:px-6 py-4 text-center text-sm text-black">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data && data.length > 0 ? (
          data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`bg-white rounded-lg p-4 shadow border border-gray-200 ${
                onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
              }`}
            >
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="mb-2 last:mb-0 flex justify-between items-start">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    {column.header}
                  </span>
                  <span className="text-sm text-gray-900 text-right ml-2 flex-1">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-4 text-center text-sm text-black">
            No data available
          </div>
        )}
      </div>
    </>
  );
}
