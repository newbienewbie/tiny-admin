# tiny-admin
a tiny Admin UI library written in React.JS


## tiny-admin 的基本结构

```js
/**
 * 默认提供的 DecoratedFormComponent 对象，提供工厂函数，用于创建普通AddOrEdit表单、和带Modal表单
 */
export const defaultDecoratedForm={

    /**
     * 工厂函数，用于创建装饰过的 AddOrEditForm 表单
     */
    createDecoratedAddOrEditForm:function(PlainAddOrEditForm){ },

    /**
     * 工厂函数，用于创建装饰过的 AddOrEditFormModal 表单
     */
    createDecoratedAddOrEditFormModal:function(PlainAddOrEditForm){ }
};


/**
 * AddForm
 */
export const addform={

    /**
     * 工厂函数，生成一个 AddForm 组件
     */
    create:function(model,AddOrEditForm){ },
};


/**
 * Datagrid
 */
export const datagrid={

    /**
     * 工厂函数，生成一个 Datagrid 组件
     */
    create:function(model,AddOrEditFormModal){ },
};
```

## 示例

针对具体的模型编写`model`和`PlainAddOrEditForm`就可以自动生成后台了。

比如对于一个角色模型，有角色名、和描述两个字段。

相应的`model`定义为：
```js
export const model={
    name:"post",
    fields:{
        title:{
            title:'资源名',
        },
        excerpt:{
            title:"摘要",
        },
        category:{
            title:"分类",
        },
        featureImageUrl:{
            title:"配图",    // 默认情况下，title是显示到`Datagrid`中的内容
            render:(text, record, index)=>text  // 如果定义了render函数，则用此函数渲染
            display:false,  // 但是一旦定义了display:false，则不会再在`Datagrid`中显示
        },
        content:{
            title:"内容",
            display:false, 
        },
    },
    actions:{
        remove:{            
            display:true,    // 是否要显示删除按钮
        },
        edit:{           
            display:true,    // 是否要显示编辑按钮
        },
    },
    methods:{
        create:postapi.create,
        remove:postapi.remove,
        update:postapi.update,
        list:postapi.list,
        detail:postapi.detail,
        publish:postapi.publish,
        approval:postapi.approval,
        sendback:postapi.sendback,
        reject:postapi.reject,
    }
};
```

普通视图组件`PlainAddOrEditForm`定义为：
```js

class PlainAddOrEditForm extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        const {getFieldDecorator,getFieldsError, getFieldError, isFieldTouched,validateFields}=this.props.form;
        const hasFieldError=(fieldname)=>isFieldTouched(fieldname) && getFieldError(fieldname);
        const hasErrors=(fieldsError)=>Object.keys(fieldsError).some(field => fieldsError[field]);
        const FormItem=Form.Item;
        return (
        <Form >
            <FormItem label='角色名' validateStatus={hasFieldError('name')} help={hasFieldError('name')||''} >
            {
                getFieldDecorator('name',{
                    rules:[{required:true,message:'角色名必填'}],
                    initialValue:this.props.initialValues.name,
                })(
                    <Input placeholder='角色名' />
                )
            }
            </FormItem>
        
            <FormItem label='描述' validateStatus={hasFieldError('description')} help={hasFieldError('description')||''} >
            {
                getFieldDecorator('description',{
                    rules:[{required:true,message:'角色描述必填'}],
                    initialValue:this.props.initialValues.description,
                })(
                    <Input placeholder='description' />
                )
            }
            </FormItem>
        
        </Form>);
        
    }
}
```
这个普通的视图组件`PlainAddOrEditForm`，并没有定义提交、重置按钮，也没有定义任何行为逻辑，更没有定义是普通的表单组件还是嵌套在对话框中实现。它只是定义了一系列用于接收输入的视图控件，仅此而已。这么做的理由是可以在上述的这些情况中复用代码。

嫌代码太长？试试`antd-snippets` [antd-snippets](https://marketplace.visualstudio.com/items?itemName=bang.antd-snippets) ([github](https://github.com/bang88/antd-snippets))。
我在`bang88`的仓库代码里添加了一个`antformwrapped`。可以快速生成上述代码。

要生成一个用于创建记录的表单组件，只要编写代码：
```js
// ... 首先定义一个普通的视图组件 PlainAddOrEditForm

// 然后再创建一个经过 AntDesign 的 Form.create()() 装饰的表单
const AddOrEditForm=decorateAddOrEditForm(PlainAddOrEditForm);
// 生成用于增加记录的表单组件，并绑定模型的
//  `#create(value,context)`
// 方法
const AddForm=addform(model,AddOrEditForm);


// 创建一个经过AntDesign的Form.create()()装饰的表单对话框
const AddOrEditFormModal=decorateAddOrEditFormModal(PlainAddOrEditForm);
// 生成用于管理记录的Datagrid组件，并绑定模型的
//  `#list(current,pageSize,condition,context)`
//  `#update(id,values,context)`
//  `#remove(id,context)`
// 方法，每次点击相应记录的action，都会执行相应操作：
//  delete: 弹出删除的确认对话框，确认是否要删除
//  edit:   弹出编辑的模态对话框，并绑定相应回调函数
const Datagrid=datagrid(model,AddOrEditFormModal);
```