const { spaceId } = require(`../config`);
const api = require(`../utils/api`);

function removeMigrations(component) {
  const { migrations, ...cleanComponent } = component;
  return cleanComponent;
}

function remove({ component }) {
  return api.delete(`spaces/${spaceId}/components/${component.id}`);
}

function list() {
  return api.get(`spaces/${spaceId}/components`);
}

function create({ component }) {
  return api.post(`spaces/${spaceId}/components`, {
    component: removeMigrations(component),
  });
}

function update({ component }) {
  return api.put(`spaces/${spaceId}/components/${component.id}`, {
    component: removeMigrations(component),
  });
}

function createOrUpdate({ component }) {
  return component.id ? update({ component }) : create({ component });
}

module.exports = {
  create,
  createOrUpdate,
  list,
  update,
  remove
};
