import Table05 from '@/components/admin/cases/table-05'
import React from 'react'

const page = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:px-4 md:pt-4">
          <Table05/>
        </div>
      </div>
    </div>
  )
}

export default page
