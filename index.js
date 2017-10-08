import React from 'react'; 
import {Row,Col,Table,Modal,Popconfirm,message,Form,Button} from 'antd';

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
 * AddForm
 */
export const addform={

    /**
     * 工厂函数，生成一个 AddForm 组件
     */
    create:function(model,AddOrEditForm){

        class AddForm extends React.Component{
            constructor(props){
                super(props);
                this.formRef=null;
                // bind `this`
                this.onOk=this.onOk.bind(this);
            }

            onOk(){
                return this.formRef.validateFields((err,value)=>{
                    if(!err){
                        model.methods.create(value)
                            .then(resp=>{
                                message.success(`创建成功`);
                                this.formRef.resetFields();
                            })
                            .catch(e=>{
                                message.error(`失败`+e);
                            });
                    }
                });
            }
        
            render() {
                return <AddOrEditForm ref={form=>this.formRef=form} onOk={this.onOk} /> ;
            }
        }

        return AddForm;
    },
};



/**
 * Datagrid
 */
export const datagrid={

    /**
     * 工厂函数，生成一个 Datagrid 组件
     */
    create:function(model,AddOrEditFormModal){

        class List extends React.Component{

            constructor(props){
                super(props);
                this.state={
                    data:[],                   // 当前数据源
                    pagination:{},             // 当前分页
                    loading:true,              // 表格是否正在加载，用于控制动画
                    currentRecord:{},          // 执行操作时的当前行记录
                    editModalVisible:false,    // 编辑表单是否可见
                };
                // 对 编辑表单组件 的引用
                this.editForm=null;
                // bind `this`
                this.onTableChange=this.onTableChange.bind(this);
                this.onRemove=this.onRemove.bind(this);
                this.onEditFormSubmit=this.onEditFormSubmit.bind(this);
                this.onEditFormCancel=this.onEditFormCancel.bind(this);
            }

            /**
             * 当表单发生分页变化、过滤器变化、或者排序器变化时，应该从服务器重新加载数据
             * @param {*} pagination 
             * @param {*} filters 
             * @param {*} sorter 
             */
            onTableChange(pagination, filters={}, sorter={}) {

                // const pager = Object.assign({},this.state.pagination);
                // pager.current = pagination.current;
                // this.setState({ pagination: pager, });

                const {pageSize,current}=pagination;
                
                return model.methods.list(current,pageSize /* ,condition */)
                    .then(result=>{
                        const {count,rows}=result;

                        const pagination = Object.assign({}, this.state.pagination );
                        pagination.total = count;

                        this.setState({ loading: false, data: rows, pagination, });
                    });
            }

            onRemove(record){
                return model.methods.remove(record.id)
                    .then(resp=>{
                        console.log(resp);
                        message.warning('删除成功');
                    })
                    // 刷新数据源
                    .then(_=>{
                        return this.onTableChange(this.state.pagination);
                    });
            }

            onEditFormSubmit(){
                return this.editForm.validateFields((err,values)=>{
                    if(!err){
                        const {id}=this.state.currentRecord;
                        model.methods.update(id,values)
                            .then(resp=>{
                                message.success(`修改成功`);
                                console.log(resp);
                                this.setState({editModalVisible:false},()=>{
                                    // 刷新数据源
                                    this.onTableChange(this.state.pagination);
                                });
                            })
                    }
                });
                
            }

            onEditFormCancel(){
                this.setState({editModalVisible:false});
            }

            componentDidMount(){
                this.setState({loading:true},()=>{
                    return this.onTableChange(this.state.pagination);
                });
            }
            render() {
                const {Column,ColumnGroup}=Table;
                const fields=model.fields;
                return (<div>
                <Table dataSource={this.state.data} pagination={this.state.pagination} loading={this.state.loading} onChange={this.onTableChange} >
                    { Object.keys(fields).map(k=>{
                        const field=fields[k];
                        return <Column title={field.title} key={k} dataIndex={k} />;
                    }) }
                    <Column title='操作' key='action' render={(text, record) => (
                        <span>
                            <a onClick={()=>{this.setState({editModalVisible:true,currentRecord:record});return false; }} >修改</a>
                            <span className='ant-divider' />
                            <Popconfirm title='确认要删除吗' okText='是' cancelText='否' onConfirm={() => { this.onRemove(record); }} >
                                <a href='#'>删除</a>
                            </Popconfirm>
                            <span className='ant-divider' />
                        </span>)} />
                </Table>

                <AddOrEditFormModal ref={form=>this.editForm=form} visible={this.state.editModalVisible}
                    initialValues={this.state.currentRecord}
                    onOk={this.onEditFormSubmit}
                    onCancel={this.onEditFormCancel}
                />

            </div>);
            }
        }

        return List;
    },

};

