const itemGroupsData = [
  {
    id: 'grp-1',
    groupName: 'Menswear',
    type: 'Gender',
    parentGroup: '',
    description: 'All products targeted for men.',
    status: 'Active',
  },
  {
    id: 'grp-2',
    groupName: 'Denim Jackets',
    type: 'Category',
    parentGroup: 'Menswear',
    description: 'Jackets crafted in denim fabric.',
    status: 'Active',
  },
  {
    id: 'grp-3',
    groupName: 'Winter Collection',
    type: 'Season',
    parentGroup: '',
    description: 'Products meant for cold weather season.',
    status: 'Inactive',
  },
];

export default itemGroupsData;
