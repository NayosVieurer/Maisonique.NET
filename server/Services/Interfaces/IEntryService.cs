using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IEntryService
{
    void Save(Guid id, EntryInput input);

    void Delete(Guid id, int version);

    void SetDone(Guid id, DoneInput input);
}
