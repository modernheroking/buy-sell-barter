let draftMedia = [];

export const setDraftMedia = (media) => {
  draftMedia = media;
};

export const getDraftMedia = () => {
  return draftMedia;
};

export const clearDraftMedia = () => {
  draftMedia = [];
};