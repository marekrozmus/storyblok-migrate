const cloneDeep = require(`lodash.clonedeep`);
const isEqual = require(`lodash.isequal`);

const config = require(`./config`);
const discover = require(`./utils/discover`);
const migrate = require(`./utils/migrate`);

const componentService = require(`./services/component`);
const storyService = require(`./services/story`);
const unpaginate = require(`./utils/unpaginate`);

if (config.dryRun) {
  // eslint-disable-next-line no-console
  console.warn(`Dry run mode activated!`);
}

function contentTypesFromComponents(components) {
  return components.map(x => x.name);
}

async function clearSpace() {
  const { data: { components: remoteComponents } } = await componentService.list();

  for (const component of remoteComponents) {
    componentService.remove({ component })
    console.info(`${component.display_name || component.name} was removed`);
  }

  const storyPages = await unpaginate({ cb: storyService.list });

  const stories = storyPages.reduce((prev, next) => [...prev, ...next.stories], []);

  for (const originalStory of stories) {
    storyService.remove({ story: originalStory });
    console.info(`Story ${ originalStory.name } was removed`);
  }
}

async function runStoriesMigrations({ stories }) {
  for (const story of stories) {
    await storyService.create({ story });
    // eslint-disable-next-line no-console
    console.log(`${story.name} component has been created`);
  }
}

async function runComponentMigrations({ components }) {
  const { data: { components: existingRemoteComponents } } = await componentService.list();

  for (const component of existingRemoteComponents) {
    componentService.remove({ component })
    console.info(`${component.display_name || component.name} was removed`);
  }

  const { data: { components: remoteComponents } } = await componentService.list();

  for (const component of components) {
    const remoteComponent = remoteComponents
      .find(x => x.name === component.name);

    if (remoteComponent) {
      if (config.dryRun) {
        // eslint-disable-next-line no-console
        console.info(`${component.display_name || component.name} component would've been updated`);
        continue;
      }
      const mappedComponent = { id: remoteComponent.id, ...component };
      await componentService.update({ component: mappedComponent });
      // eslint-disable-next-line no-console
      console.log(`${component.display_name || component.name} component has been updated`);
      continue;
    }

    if (config.dryRun) {
      // eslint-disable-next-line no-console
      console.info(`${component.display_name || component.name} component would've been created`);
      continue;
    }

    await componentService.create({ component });
    // eslint-disable-next-line no-console
    console.log(`${component.display_name || component.name} component has been created`);
  }
}

async function runContentMigrations({ components }) {
  const contentTypes = contentTypesFromComponents(components);
  const storyPages = await unpaginate({ cb: storyService.list, params: { contentTypes } });
  const stories = storyPages.reduce((prev, next) => [...prev, ...next.stories], []);

  for (const originalStory of stories) {
    const story = cloneDeep(originalStory);
    const componentName = story.content.component;
    const component = discover.componentByName(componentName);

    if (!component) {
      throw new Error(`No component found for name "${componentName}"`);
    }

    migrate({
      component,
      content: story.content,
    });

    if (isEqual(story, originalStory)) {
      // eslint-disable-next-line no-console
      console.info(`Story "${story.id}" has not changed and was skipped`);
      continue;
    }

    if (config.dryRun) {
      // eslint-disable-next-line no-console
      console.info(`Story "${story.id}" would've been updated`);
      continue;
    }

    await storyService.update({ story });
    // eslint-disable-next-line no-console
    console.log(`Story "${story.id}" has been updated`);
  }
}

module.exports = {
  runComponentMigrations,
  runContentMigrations,
  clearSpace,
  runStoriesMigrations,
};
