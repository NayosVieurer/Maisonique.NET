using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IPersonService
{
    void Save(Guid id, PersonInput input);

    void Delete(Guid id, int version);
}
