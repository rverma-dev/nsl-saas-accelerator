constraints_min_version(1).

% Reference for other constraints:
%   https://github.com/babel/babel/blob/main/constraints.pro
%   https://github.com/yarnpkg/berry/blob/master/constraints.pro

% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  % Iterates over all dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
    WorkspaceCwd \= 'packages/docusaurus',
  % Iterates over similarly-named dependencies from all workspaces (again)
    workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
    OtherWorkspaceCwd \= 'packages/demo',
  % Ignore peer dependencies
    DependencyType \= 'peerDependencies',
    DependencyType2 \= 'peerDependencies',
  % Ignore devDependencies on other workspaces
    (
      (DependencyType = 'devDependencies'; DependencyType2 = 'devDependencies') ->
        \+ workspace_ident(DependencyCwd, DependencyIdent)
      ;
        true
    ).


% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').

% Enforces the license in all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'license', 'MIT || Apache') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'license', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces the repository field for all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'repository.type', 'git') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.url', 'https://github.com/rverma-nsl/nsl-saas-accelerator.git') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.directory', WorkspaceCwd) :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces 'publishConfig.access' is set to public for public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'publishConfig.access', 'public') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'publishConfig.access', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces the engines.node field for all workspace to adhere aws lambda environment depreciation
gen_enforced_field(WorkspaceCwd, 'engines.node', '^16.10.0 || >=18.0.0') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).

% Enforces the main and types field to start with ./
gen_enforced_field(WorkspaceCwd, FieldName, ExpectedValue) :-
  % Fields the rule applies to
  member(FieldName, ['main', 'types']),
  % Get current value
  workspace_field(WorkspaceCwd, FieldName, CurrentValue),
  % Must not start with ./ already
  \+ atom_concat('./', _, CurrentValue),
  % Store './' + CurrentValue in ExpectedValue
  atom_concat('./', CurrentValue, ExpectedValue).