import React, { Component } from "react"
import { ZcyList, Input, ZcyBreadcrumb } from "doraemon"

const columns = [
  { title: "测试", dataIndex: "test1", key: "test1" },
  { title: "测试2", dataIndex: "test2", key: "test2" }
]
const customItem = [
  { label: "姓名", id: "name", render: "() => { return <Input />;}" },
  { label: "年龄", id: "age", render: "() => {return <Input />;}" }
]

export default class MODULE extends Component {
  render() {
    return (
      <div>
        <ZcyBreadcrumb routes={breadcrumb} />
        <ZcyList
          customItem={customItem}
          tabs={tabs}
          tabKey="type"
          table={{
            columns: columns,
            dataSource: []
          }}
        />
      </div>
    )
  }
}
