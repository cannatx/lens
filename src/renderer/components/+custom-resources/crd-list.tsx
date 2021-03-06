import "./crd-list.scss";

import React from "react";
import { computed } from "mobx";
import { observer } from "mobx-react";
import { Link } from "react-router-dom";
import { stopPropagation } from "../../utils";
import { KubeObjectListLayout } from "../kube-object";
import { crdStore } from "./crd.store";
import { CustomResourceDefinition } from "../../api/endpoints/crd.api";
import { Select, SelectOption } from "../select";
import { createPageParam } from "../../navigation";
import { Icon } from "../icon";

export const crdGroupsUrlParam = createPageParam<string[]>({
  name: "groups",
  multiValues: true,
  isSystem: true,
  defaultValue: [],
});

enum sortBy {
  kind = "kind",
  group = "group",
  version = "version",
  scope = "scope",
  age = "age",
}

@observer
export class CrdList extends React.Component {
  @computed get groups(): string[] {
    return crdGroupsUrlParam.get();
  }

  onSelectGroup(group: string) {
    const groups = new Set(this.groups);

    if (groups.has(group)) {
      groups.delete(group); // toggle selection
    } else {
      groups.add(group);
    }
    crdGroupsUrlParam.set(Array.from(groups));
  }

  render() {
    const selectedGroups = this.groups;
    const sortingCallbacks = {
      [sortBy.kind]: (crd: CustomResourceDefinition) => crd.getResourceKind(),
      [sortBy.group]: (crd: CustomResourceDefinition) => crd.getGroup(),
      [sortBy.version]: (crd: CustomResourceDefinition) => crd.getVersion(),
      [sortBy.scope]: (crd: CustomResourceDefinition) => crd.getScope(),
    };

    return (
      <KubeObjectListLayout
        className="CrdList"
        isClusterScoped={true}
        store={crdStore}
        sortingCallbacks={sortingCallbacks}
        searchFilters={Object.values(sortingCallbacks)}
        filterItems={[
          (items: CustomResourceDefinition[]) => {
            return selectedGroups.length ? items.filter(item => selectedGroups.includes(item.getGroup())) : items;
          }
        ]}
        renderHeaderTitle="Custom Resources"
        customizeHeader={() => {
          let placeholder = <>All groups</>;

          if (selectedGroups.length == 1) placeholder = <>Group: {selectedGroups[0]}</>;
          if (selectedGroups.length >= 2) placeholder = <>Groups: {selectedGroups.join(", ")}</>;

          return {
            // todo: move to global filters
            filters: (
              <Select
                className="group-select"
                placeholder={placeholder}
                options={Object.keys(crdStore.groups)}
                onChange={({ value: group }: SelectOption) => this.onSelectGroup(group)}
                controlShouldRenderValue={false}
                formatOptionLabel={({ value: group }: SelectOption) => {
                  const isSelected = selectedGroups.includes(group);

                  return (
                    <div className="flex gaps align-center">
                      <Icon small material="folder"/>
                      <span>{group}</span>
                      {isSelected && <Icon small material="check" className="box right"/>}
                    </div>
                  );
                }}
              />
            )
          };
        }}
        renderTableHeader={[
          { title: "Resource", className: "kind", sortBy: sortBy.kind },
          { title: "Group", className: "group", sortBy: sortBy.group },
          { title: "Version", className: "version", sortBy: sortBy.group },
          { title: "Scope", className: "scope", sortBy: sortBy.scope },
          { title: "Age", className: "age", sortBy: sortBy.age },
        ]}
        renderTableContents={(crd: CustomResourceDefinition) => [
          <Link key="link" to={crd.getResourceUrl()} onClick={stopPropagation}>
            {crd.getResourceTitle()}
          </Link>,
          crd.getGroup(),
          crd.getVersion(),
          crd.getScope(),
          crd.getAge(),
        ]}
      />
    );
  }
}
