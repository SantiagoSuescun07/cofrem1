import api from "@/lib/axios";

export const getPqrsTypes = async () => {
  const { data } = await api.get("/jsonapi/taxonomy_term/pqrs_type");
  return data.data.map((item: any) => ({
    id: item.attributes.drupal_internal__tid,
    name: item.attributes.name,
  }));
};

export const getUrgencyLevels = async () => {
  const { data } = await api.get("/jsonapi/taxonomy_term/urgency_level");
  return data.data.map((item: any) => ({
    id: item.attributes.drupal_internal__tid,
    name: item.attributes.name,
  }));
};

export const getDependencies = async () => {
  const { data } = await api.get("/jsonapi/taxonomy_term/dependencies");
  return data.data.map((item: any) => ({
    id: item.attributes.drupal_internal__tid,
    name: item.attributes.name,
  }));
};
