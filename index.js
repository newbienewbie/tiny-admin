import React from 'react'; 
import {Row,Col,Table,Modal,Popconfirm,message,Form,Button} from 'antd';

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

/**
 * 判断字段是否显示。
 * 如果某个字段明确定义设置为`false`或者其`display`属性设置为`false`，则不予显示
 * @param {*} obj 
 * @param {String} prop  属性名
 */
function displayable(obj,prop){
    // 默认情况下，某个字段是显示的
    let display=true;

    // 如果未定义obj，直接返回
    if(!obj){ return display; }

    // 如果明确定义了该属性为false或者该属性的display:false，则不予显示
    if(obj.hasOwnProperty(prop) && (obj[prop]==false || obj[prop].display==false)){
        display=false;
    }
    return display;
}


/**
 * 默认提供的 DecoratedFormComponent 对象，提供工厂函数，用于创建普通AddOrEdit表单、和带Modal表单
 */
export const defaultDecoratedForm={

    /**
     * 工厂函数，用于创建装饰过的 AddOrEditForm 表单
     */
    createDecoratedAddOrEditForm:function(PlainAddOrEditForm){

        class PlainAddOrEditFormWithSubmitButton extends React.Component{
            constructor(props){
                super(props);
            }
            render(){
                return <div>
                    <PlainAddOrEditForm form={this.props.form} initialValues={this.props.initialValues}/>
                    <Button htmlType="submit" type="primary" onClick={this.props.onOk}> 提交 </Button>
                </div>;
            }
        }

        return Form.create()(PlainAddOrEditFormWithSubmitButton);
    },

    /**
     * 工厂函数，用于创建装饰过的 AddOrEditFormModal 表单
     */
    createDecoratedAddOrEditFormModal:function(PlainAddOrEditForm){

        class PlainAddOrEditFormWithModal extends React.Component{
            constructor(props){
                super(props);
            }
            render(){
                return <Modal title="Title" okText="提交" cancelText="取消"
                    visible={this.props.visible} data={this.props.data}
                    onOk={this.props.onOk} onCancel={this.props.onCancel}
                >
                    <PlainAddOrEditForm form={this.props.form} initialValues={this.props.initialValues} />
                </Modal>
                ;
            }
        }
        return Form.create()(PlainAddOrEditFormWithModal);
    }
};



/**
 * 工厂函数，生成一个 AddForm 组件
 * @param {*} model 
 * @param {*} AddOrEditForm 
 */
export function addform(model,AddOrEditForm){

    class AddForm extends React.Component{
        constructor(props){
            super(props);
            this.formRef=null;
            // bind `this`
            this.onOk=this.onOk.bind(this);
        }

        onOk(context={}){
            return this.formRef.validateFields((err,value)=>{
                if(!err){
                    model.methods.create(value,context)
                        .then(resp=>{
                            if(resp.status=='SUCCESS'){
                                message.success(`创建成功`);
                                this.formRef.resetFields();
                            }else{
                                message.error(`创建失败${resp.msg}`);
                            }
                        })
                        .catch(e=>{
                            message.error(`失败`);
                        });
                }
            });
        }
    
        render() {
            return <AddOrEditForm ref={form=>this.formRef=form} onOk={_=>{this.onOk(this.props.formContext);}} /> ;
        }
    }

    return AddForm;
}

/**
 * 工厂函数，生成一个 EditForm 组件
 * @param {*} model 
 * @param {*} AddOrEditForm 
 */
export function editform(model,AddOrEditForm){

    class EditForm extends React.Component{
        constructor(props){
            super(props);
            this.formRef=null;
            // bind `this`
            this.onOk=this.onOk.bind(this);
        }

        onOk(context={}){
            return this.formRef.validateFields((err,value)=>{
                if(!err){
                    const id=this.props.id;
                    model.methods.update(id,value,context)
                        .then(resp=>{
                            if(resp.status=="SUCCESS"){
                                message.success(`修改成功`);
                                this.formRef.resetFields();
                            }else{
                                message.error(`修改失败${resp.msg}`);
                                console.log(resp);
                            }
                        })
                        .catch(e=>{
                            message.error(`失败`+e);
                        });
                }
            });
        }
    
        render() {
            return <AddOrEditForm initialValues={this.props.initialValues} ref={form=>this.formRef=form} onOk={_=>{this.onOk(this.props.formContext);}} /> ;
        }
    }

    return EditForm;
}



/**
 * 工厂函数，生成一个 Datagrid 组件
 * @param {*} model 
 * @param {*} AddOrEditFormModal 
 */
export function datagrid(model,AddOrEditFormModal){


    /**
     * <Datagrid/>组件，接收onRowClick 属性和 headItem属性
     * onRowClick: 当点击行候触发
     * headItem: 当设置后，此Datagrid表示是与一个头项目互关联的行项目构成的列表
     */
    class Datagrid extends React.Component{

        constructor(props){
            super(props);
            this.state={
                data:[],                   // 当前数据源
                pagination:{},             // 当前分页
                loading:true,              // 表格是否正在加载，用于控制动画
                currentRecord:{},          // 执行操作时的当前行记录
                editModalVisible:false,    // 编辑表单是否可见
                selectedRowKeys:[],        // 当前选中的行
            };
            // 对 编辑表单组件 的引用
            this.editForm=null;
            // bind `this`
            this.promiseSetState=this.promiseSetState.bind(this);
            this.onTableChange=this.onTableChange.bind(this);
            this.onRemove=this.onRemove.bind(this);
            this.onEditFormSubmit=this.onEditFormSubmit.bind(this);
            this.onEditFormCancel=this.onEditFormCancel.bind(this);
            // a hook exposed to parent component
            this.refresh=this.refresh.bind(this);
            this._renderFieldsColumn=this._renderFieldsColumn.bind(this);
            this._renderActionsColumn=this._renderActionsColumn.bind(this);
        }

        refresh(context){
            return this.onTableChange(this.state.pagination,{},{},context);
        }

        promiseSetState(state){
            return new Promise((resolve,reject)=>{
                this.setState(state,()=>{ resolve(); });
            });
        }

        /**
         * 当表单发生分页变化、过滤器变化、或者排序器变化时，应该从服务器重新加载数据
         * @param {*} pagination 
         * @param {*} condition 条件 
         * @param {*} sorter 
         */
        onTableChange(pagination, condition={}, sorter={},context={}) {

            // const pager = Object.assign({},this.state.pagination);
            // pager.current = pagination.current;
            // this.setState({ pagination: pager, });

            const {pageSize,current}=pagination;
            
            return model.methods.list(current,pageSize ,condition , context)
                .then(result=>{
                    const {count,rows}=result;

                    const pagination = Object.assign({}, this.state.pagination );
                    pagination.total = count;
                    pagination.current=current;

                    return this.promiseSetState({ 
                        loading: false, 
                        data:rows? rows.map(r=>{
                            r.key=r.id;
                            return r;
                        }) :[], 
                        pagination, 
                    });
                });
        }

        onRemove(id,context={}){
            return model.methods.remove(id,context)
                .then(resp=>{
                    console.log(resp);
                    message.warning('删除成功');
                })
                // 刷新数据源
                .then(_=>{
                    return this.onTableChange(this.state.pagination,{},{},context);
                });
        }

        /**
         * 高阶函数，动态生成一个函数，用于处理表单提交
         * @param {*} context 
         */
        onEditFormSubmit(context){
            return this.editForm.validateFields((err,values)=>{
                if(!err){
                    const {id}=this.state.currentRecord;
                    model.methods.update(id,values,context)
                        .then(resp=>{
                            message.success(`修改成功`);
                            return this.promiseSetState({editModalVisible:false})
                        })
                        .then(()=>{
                            // 刷新数据源
                            return this.onTableChange(this.state.pagination,{},{},context);
                        });
                }
            });
        }

        onEditFormCancel(){
            return this.promiseSetState({editModalVisible:false});
        }

        /**
         * 一旦接收到新的属性，如果headItem发生变化，则立即刷新
         * @param {*} nextProps 
         */
        componentWillReceiveProps(nextProps){
            if( !nextProps.headItem || !nextProps.headItem.id || nextProps.headItem.id==this.props.headItem.id){
                return;
            }else{
                let headItem=nextProps.headItem;
                return this.promiseSetState({loading:true})
                    .then(_=>{
                        return this.onTableChange(this.state.pagination,{},{},{headItem});
                    })
                    .then(_=>{
                        // 重置 selectedRowKeys
                        return this.promiseSetState({selectedRowKeys:[]});
                    });
            }
        }

        componentDidMount(){
            const headItem=this.props.headItem;
            this.setState({loading:true},()=>{
                return this.onTableChange(this.state.pagination,{},{},{headItem});
            });
        }


        _renderFieldsColumn(){
            const fields=model.fields;
            return Object.keys(fields)
                .filter(k=> displayable(fields,k) )
                .map(k=>{
                    const field=fields[k];
                    if(isFunction(field.render)){
                        return <Table.Column title={field.title} key={k} dataIndex={k} render={field.render} />;
                    }else{
                        return <Table.Column title={field.title} key={k} dataIndex={k} />;
                    }
                }); 
        }

        _renderActionsColumn(){
            let actions=model.actions;
            return (
            <Table.Column title='操作' key='action' render={(text, record) => (
                <span>
                    {displayable(actions,'edit') ?
                        (<span>
                            <a onClick={()=>{
                                this.editForm.setFieldsValue(record);
                                this.setState({editModalVisible:true,currentRecord:record});
                                return false; 
                            }} >修改</a>
                            <span className='ant-divider' />
                        </span>):
                        ""
                    }
                    {displayable(actions,'delete') ?
                        (<span>
                            <Popconfirm title='确认要删除吗' okText='是' cancelText='否' onConfirm={() => { 
                                this.onRemove(record.id,{headItem}); 
                            }} >
                                <a href='#'>删除</a>
                            </Popconfirm>
                            <span className='ant-divider' />
                        </span>) :
                        ""
                    }
                </span>)} 
            />);
        }

        render() {
            const {Column,ColumnGroup}=Table;
            const fields=model.fields;
            const headItem=this.props.headItem;
            return (<div>
                <Table rowSelection={{
                        type:'radio',
                        selectedRowKeys:this.state.selectedRowKeys,
                        onChange:(selectedRowKeys,selectedRows)=>this.setState({selectedRowKeys})
                    }} 
                    onRowClick={(record,index,event)=>{
                        this.promiseSetState({selectedRowKeys:[record.key]})
                            .then(_=>{
                                this.props.onRowClick && this.props.onRowClick(record,index,event);
                            });
                        return false;
                    }}  
                    dataSource={this.state.data} 
                    pagination={this.state.pagination} 
                    loading={this.state.loading} 
                    onChange={this.onTableChange} 
                >
                    {this._renderFieldsColumn()}
                    {this._renderActionsColumn()}
                </Table>

                <AddOrEditFormModal ref={form=>this.editForm=form} visible={this.state.editModalVisible}
                    initialValues={this.state.currentRecord}
                    onOk={()=>{
                        this.onEditFormSubmit({headItem});
                        return false;
                    }}
                    onCancel={this.onEditFormCancel}
                />

            </div>);
        }
    }

    Datagrid.defaultProps={
        displayDeleteAction:true,
        displayEditAction:true,
    };

    return Datagrid;
}
