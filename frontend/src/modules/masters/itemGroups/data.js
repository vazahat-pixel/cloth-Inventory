const itemGroupsData = [
  {
    id: '65f1a2c3b4d5e6f7a8b9c101',
    groupName: 'Menswear',
    type: 'Gender',
    parentGroup: '',
    description: 'All products targeted for men.',
    status: 'Active',
  },
  {
    id: '65f1a2c3b4d5e6f7a8b9c102',
    groupName: 'Denim Jackets',
    type: 'Category',
    parentGroup: '65f1a2c3b4d5e6f7a8b9c101',
    description: 'Jackets crafted in denim fabric.',
    status: 'Active',
  },
  {
    id: '65f1a2c3b4d5e6f7a8b9c103',
    groupName: 'Winter Collection',
    type: 'Season',
    parentGroup: '',
    description: 'Products meant for cold weather season.',
    status: 'Inactive',
  },
];

export default itemGroupsData;
