// Turns flat rows with parentId into a sorted tree (APCMMS json.utils groupJsonByKey equivalent).
// Rows whose parent is missing from the list are dropped, so a hidden parent hides its children.
export function buildTree(rows, { sortBy = 'sequence' } = {}) {
    const nodes = new Map(rows.map(row => [row.id, { ...row, children: [] }]));
    const roots = [];
    for (const node of nodes.values()) {
        if (node.parentId == null)
            roots.push(node);
        else
            nodes.get(node.parentId)?.children.push(node);
    }
    const sort = list => list.sort((a, b) => a[sortBy] - b[sortBy]).forEach(node => sort(node.children));
    sort(roots);
    return roots;
}
