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
const model={
    name:"role",
    fields:{
        "name":{
            title:'角色名',
        },
        "description":{
            title:"角色米哦啊书",
        },
    },
    methods:{
        create:function(record){
            const {name,description}=record;
            return createRole(name,description);
        },
        remove:removeRole,
        update:function(id,record){
            const{name,description}=record;
            return updateRole(id,name,description);
        },
        list:listRoles,
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
嫌代码太长？试试`antd-snippets` [antd-snippets](https://marketplace.visualstudio.com/items?itemName=bang.antd-snippets) ([github](https://github.com/bang88/antd-snippets))。
我在`bang88`的仓库代码里添加了一个`antformwrapped`。可以快速生成上述代码。

要生成一个用于创建角色的表单，只要编写代码：
```js
const AddOrEditForm=defaultDecoratedForm.createDecoratedAddOrEditForm(PlainAddOrEditForm);
const AddForm=addform.create(model,AddOrEditForm);
```

要生成一个用于管理角色的`Datagrid`，只要使用以下代码：
```js
const AddOrEditFormModal=defaultDecoratedForm.createDecoratedAddOrEditFormModal(PlainAddOrEditForm);
const DG=datagrid.create(model,AddOrEditFormModal);
```