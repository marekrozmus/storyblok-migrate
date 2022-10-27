const { spaceId } = require(`../config`);
const api = require(`../utils/api`);

function removeMigrations(component) {
  const { migrations, ...cleanComponent } = component;
  return cleanComponent;
}

function remove({ component }) {
  Storyblok.delete(`spaces/${spaceId}/components/${component.id}`).then(response => {
    console.log(response)
  }).catch(error => { 
    console.log(error)
  })
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
